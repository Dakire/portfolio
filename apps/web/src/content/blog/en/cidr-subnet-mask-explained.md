---
title: 'CIDR and subnet masks explained: /24, /27 and subnetting'
description: 'Understand CIDR notation (/24, /27…), the dotted-decimal mask, usable addresses, splitting a network into subnets, the /31 and /32 cases and private ranges, with checked calculations.'
date: 2026-10-28
translationOf: 'calcul-masque-cidr-expliques'
category: dns
tags: ['Networking', 'CIDR', 'Subnet mask', 'Subnet', 'IPv4', 'RFC 1918']
---

"Put the server on 192.168.1.130/27": until you can read that `/27`, it is hard to tell which machines talk to each other directly, or where the network ends. Here is the method, with calculations you can redo by hand (and check with the site's [subnet calculator](/en/tools/subnet-calculator/)).

## What /24 means

An IPv4 address is 32 bits long. **CIDR** notation (RFC 4632) attaches a number to the address: the **prefix**, meaning the number of bits, counted from the left, that identify the network. The remaining bits identify the machine within that network.

- `/24`: 24 network bits, 8 host bits;
- `/27`: 27 network bits, 5 host bits.

The **mask** is the same information in dotted decimal: network bits set to 1, the others to 0. For `/24`, 11111111.11111111.11111111.00000000, that is `255.255.255.0`. For `/27`, the last octet is 11100000, which is 224: `255.255.255.224`.

## Available addresses

With `h` host bits, a network holds 2^h addresses. Two are reserved:

- the first one, the **network address** (all host bits at 0);
- the last one, the **broadcast address** (all host bits at 1).

That leaves **2^h − 2 usable addresses** for machines (the router included).

| Prefix | Mask            | Addresses | Usable    |
| ------ | --------------- | --------- | --------- |
| /16    | 255.255.0.0     | 65,536    | 65,534    |
| /20    | 255.255.240.0   | 4,096     | 4,094     |
| /22    | 255.255.252.0   | 1,024     | 1,022     |
| /24    | 255.255.255.0   | 256       | 254       |
| /25    | 255.255.255.128 | 128       | 126       |
| /26    | 255.255.255.192 | 64        | 62        |
| /27    | 255.255.255.224 | 32        | 30        |
| /28    | 255.255.255.240 | 16        | 14        |
| /29    | 255.255.255.248 | 8         | 6         |
| /30    | 255.255.255.252 | 4         | 2         |
| /31    | 255.255.255.254 | 2         | see below |
| /32    | 255.255.255.255 | 1         | see below |

## Example 1: 192.168.1.130/27

The mask is `255.255.255.224`. Blocks are 256 − 224 = **32** addresses in size, so the last octet falls in blocks starting at 0, 32, 64, 96, 128, 160… Address 130 is in the block starting at 128.

- network address: `192.168.1.128`;
- broadcast: `192.168.1.159` (128 + 32 − 1);
- usable addresses: `192.168.1.129` to `192.168.1.158`, that is 30 machines.

## Example 2: 10.20.30.77/20

The mask is `255.255.240.0`: it is the third octet that gets split. Block size: 256 − 240 = 16, in the third octet. 30 falls in the block starting at 16 (16, 32, 48…).

- network address: `10.20.16.0`;
- broadcast: `10.20.31.255`;
- usable: `10.20.16.1` to `10.20.31.254`, that is 4,094 machines.

## Splitting a network into subnets

Each prefix bit you add **halves** the network. To cut `192.168.10.0/24` into four, go from `/24` to `/26` (2 more bits, 2² = 4 subnets of 64 addresses):

| Subnet              | Usable                               | Broadcast        |
| ------------------- | ------------------------------------ | ---------------- |
| `192.168.10.0/26`   | `192.168.10.1` to `192.168.10.62`    | `192.168.10.63`  |
| `192.168.10.64/26`  | `192.168.10.65` to `192.168.10.126`  | `192.168.10.127` |
| `192.168.10.128/26` | `192.168.10.129` to `192.168.10.190` | `192.168.10.191` |
| `192.168.10.192/26` | `192.168.10.193` to `192.168.10.254` | `192.168.10.255` |

For different needs (a network of 50 workstations, one of 20, a link between two routers), split into variable sizes, starting with the largest. Always leave some headroom: renumbering a network costs more than a slightly oversized `/24`.

## /31 and /32

- **/30**: 4 addresses, 2 usable. This was the classic size for a point-to-point link between two devices.
- **/31**: only 2 addresses. On a point-to-point link, RFC 3021 allows using both as host addresses (no network or broadcast address), which saves half the addresses. Both ends must support this mode.
- **/32**: a single address, designating one specific machine. You meet it with a loopback address, a route to a single host, or a firewall rule targeting one machine.

## Private addresses (RFC 1918)

Three ranges are reserved for internal networks and are not routed on the Internet:

| Range                          | Notation         |
| ------------------------------ | ---------------- |
| 10.0.0.0 to 10.255.255.255     | `10.0.0.0/8`     |
| 172.16.0.0 to 172.31.255.255   | `172.16.0.0/12`  |
| 192.168.0.0 to 192.168.255.255 | `192.168.0.0/16` |

A frequent trap: the `172.16.0.0/12` range stops at `172.31`. `172.32.x.x` is a public address. Another classic: two sites joined by a VPN that both use `192.168.1.0/24` cannot reach each other without NAT; pick distinct ranges from the start.

## Checking quickly

Three reflexes to sanity-check a result: the network address is a multiple of the block size; the broadcast is just before the next block; a host and its gateway must be in the same subnet. The [subnet calculator](/en/tools/subnet-calculator/) gives the mask, range and host count for any prefix. More network commands are in the [networking cheat sheet](/cheatsheets/reseau/). On the naming side, [DNS records explained](/en/blog/dns-records-explained-a-mx-cname-txt/) links addresses to names.

## Sources

- [RFC 4632: CIDR, the Internet address assignment and aggregation plan](https://www.rfc-editor.org/rfc/rfc4632)
- [RFC 1918: address allocation for private internets](https://www.rfc-editor.org/rfc/rfc1918)
- [RFC 3021: using 31-bit prefixes on point-to-point links](https://www.rfc-editor.org/rfc/rfc3021)
