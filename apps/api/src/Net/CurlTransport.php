<?php

declare(strict_types=1);

namespace Grichard\Api\Net;

/**
 * Transport cURL (extension disponible sur l'hébergement OVH). Chaque échange :
 * - se connecte à l'IP déjà validée (CURLOPT_RESOLVE), jamais à une IP obtenue par une nouvelle résolution (DNS rebinding) ;
 * - n'accepte que http et https, ne suit aucune redirection (SafeHttpClient revalide chaque étape), n'utilise aucun proxy ;
 * - plafonne le corps reçu (décompressé) : au-delà, la lecture s'arrête et la réponse est marquée tronquée ;
 * - vérifie les certificats TLS.
 */
final class CurlTransport implements Transport
{
    /** @param bool $nativeCa magasin de certificats du système d'exploitation (développement sous Windows) ; jamais utile sous Linux */
    public function __construct(private readonly bool $nativeCa = false) {}

    public function available(): bool
    {
        return \function_exists('curl_multi_init');
    }

    public function sendAll(array $requests): array
    {
        if ([] === $requests) {
            return [];
        }
        $multi = curl_multi_init();
        $handles = [];
        $exchanges = [];
        foreach ($requests as $key => $request) {
            $exchange = new CurlExchange($request->maxBytes);
            $handle = curl_init($request->url->toString());
            $authority = str_contains($request->ip, ':') ? '[' . $request->ip . ']' : $request->ip;
            $headerLines = [];
            foreach ($request->headers as $name => $value) {
                $headerLines[] = $name . ': ' . $value;
            }
            curl_setopt_array($handle, [
                CURLOPT_RESOLVE => [$request->url->host . ':' . $request->url->port . ':' . $authority],
                CURLOPT_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
                CURLOPT_REDIR_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
                CURLOPT_FOLLOWLOCATION => false,
                CURLOPT_PROXY => '',
                CURLOPT_NOPROXY => '*',
                CURLOPT_CONNECTTIMEOUT_MS => (int) ($request->connectTimeoutSeconds * 1000),
                CURLOPT_TIMEOUT_MS => (int) ($request->timeoutSeconds * 1000),
                CURLOPT_SSL_VERIFYPEER => true,
                CURLOPT_SSL_VERIFYHOST => 2,
                CURLOPT_SSL_OPTIONS => $this->nativeCa ? CURLSSLOPT_NATIVE_CA : 0,
                CURLOPT_ENCODING => '', // annonce gzip/deflate/br et décompresse ; l'en-tête Content-Encoding reste lisible
                CURLOPT_HTTPHEADER => $headerLines,
                CURLOPT_NOBODY => 'HEAD' === $request->method,
                CURLOPT_HEADERFUNCTION => static fn(\CurlHandle $h, string $line): int => $exchange->header($line),
                CURLOPT_WRITEFUNCTION => static fn(\CurlHandle $h, string $chunk): int => $exchange->write($chunk),
            ]);
            curl_multi_add_handle($multi, $handle);
            $handles[$key] = $handle;
            $exchanges[$key] = $exchange;
        }

        do {
            $status = curl_multi_exec($multi, $running);
            if ($running > 0) {
                curl_multi_select($multi, 0.2);
            }
        } while ($running > 0 && CURLM_OK === $status);

        // En mode multi, curl_errno() ne reflète pas l'issue du transfert : elle se lit dans la file des messages.
        $codes = [];
        while (false !== ($info = curl_multi_info_read($multi))) {
            if ($info['handle'] instanceof \CurlHandle && \is_int($info['result'])) {
                $codes[spl_object_id($info['handle'])] = $info['result'];
            }
        }

        $results = [];
        foreach ($requests as $key => $_) {
            $handle = $handles[$key];
            $exchange = $exchanges[$key];
            $errno = $codes[spl_object_id($handle)] ?? CURLE_OPERATION_TIMEDOUT;
            $seconds = (float) curl_getinfo($handle, CURLINFO_TOTAL_TIME);
            if (0 !== $errno && !(CURLE_WRITE_ERROR === $errno && $exchange->truncated)) {
                $results[$key] = TransportResult::failed(self::reason($errno), $seconds);
            } else {
                $results[$key] = new TransportResult(
                    status: (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE),
                    headers: $exchange->headers,
                    body: $exchange->body,
                    truncated: $exchange->truncated,
                    seconds: $seconds,
                    firstByteSeconds: (float) curl_getinfo($handle, CURLINFO_STARTTRANSFER_TIME),
                );
            }
            curl_multi_remove_handle($multi, $handle);
        }
        curl_multi_close($multi);

        return $results;
    }

    private static function reason(int $errno): string
    {
        return match ($errno) {
            CURLE_OPERATION_TIMEDOUT => FetchError::TIMEOUT,
            CURLE_COULDNT_RESOLVE_HOST => FetchError::DNS,
            // 35 : poignée de main TLS, 51/60 : certificat refusé, 58 : certificat client, 77 : magasin de certificats
            35, 51, 58, 60, 77 => FetchError::TLS,
            default => FetchError::CONNECTION,
        };
    }
}
