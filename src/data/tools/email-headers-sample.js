// En-têtes d'exemple (fictifs) proposés par l'analyseur : un message authentifié, trois sauts, une liste de diffusion.
export const SAMPLE_HEADERS = `Received: from mail-out.example-mailer.net (mail-out.example-mailer.net [203.0.113.25])
	by mx1.mail.ovh.net with ESMTPS id abc123 (version=TLSv1.3 cipher=TLS_AES_256_GCM_SHA384 bits=256);
	Tue, 3 Jun 2025 10:00:07 +0200
Received: from smtp.example-mailer.net (smtp.example-mailer.net [198.51.100.7])
	by mail-out.example-mailer.net with ESMTP id def456;
	Tue, 3 Jun 2025 10:00:05 +0200 (CEST)
Received: from app01.internal (unknown [10.1.2.3])
	by smtp.example-mailer.net (Postfix) with ESMTPSA id ghi789;
	Tue, 3 Jun 2025 08:00:04 +0000 (UTC)
Authentication-Results: mx1.mail.ovh.net;
	dkim=pass header.d=example-mailer.net header.s=mail2025 header.b=AbCdEf;
	spf=pass smtp.mailfrom=bounce@example-mailer.net;
	dmarc=pass header.from=example-mailer.net
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=example-mailer.net; s=mail2025;
	t=1748937604; h=from:to:subject:date:message-id:list-unsubscribe;
	bh=2jmj7l5rSw0yVb/vlWAYkK/YBwk=; b=AbCdEf
Return-Path: <bounce@example-mailer.net>
From: "Example Mailer" <news@example-mailer.net>
To: guillaume@grichard.eu
Subject: Votre facture de mai
Date: Tue, 3 Jun 2025 10:00:04 +0200
Message-ID: <20250603080004.1@example-mailer.net>
List-Unsubscribe: <mailto:unsub@example-mailer.net>
`;
