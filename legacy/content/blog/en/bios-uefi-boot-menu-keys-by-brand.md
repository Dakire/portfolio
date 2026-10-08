---
title: BIOS/UEFI and Boot Menu Keys by PC Brand
description: Searchable table of the keys to enter the BIOS/UEFI and open the boot menu: Dell, HP, Lenovo, ASUS, Acer, MSI, Surface, Mac and more.
date: 2026-10-03
script: /js/table-filter.js
translationOf: touches-bios-uefi-boot-menu-par-marque
---

To boot from a USB drive, reinstall Windows or change a setting (Secure Boot, TPM, boot order), you need to enter the **BIOS/UEFI** or open the **boot menu**. The key to press **varies by manufacturer, and sometimes by product line**. Here is a searchable table: type a brand or series (for example `thinkpad`, `dell`, `rog`).

<input type="search" data-filter-table aria-label="Search for a brand or model" placeholder="Search for a brand or model (e.g. thinkpad, dell, msi)…" hidden>

| Brand | Series / models | BIOS / UEFI | Boot menu | Notes |
|---|---|---|---|---|
| Acer | Aspire, Swift, Nitro, Predator, TravelMate, Extensa | F2 (Del on some desktops) | F12 | On some models, you must first enable "F12 Boot Menu" in the BIOS |
| ASUS | VivoBook, ZenBook, ExpertBook, laptops in general | F2 (held down while pressing Power) | Esc held down while pressing Power, released when the menu appears | Procedure given by ASUS for laptops |
| ASUS | ROG, TUF Gaming (laptops) | F2 | Esc held down at startup | See the ASUS laptops row |
| ASUS | Motherboards and desktops | Del (or F2) | F8 | F8 opens the boot menu during startup |
| Dell | Latitude, XPS, Inspiron, Vostro, Precision, OptiPlex | F2 | F12 | Tap the key repeatedly as soon as the logo appears |
| HP | Pavilion, EliteBook, ProBook, ZBook, Omen, Envy, Spectre | Esc then F10 | Esc then F9 | Esc opens the HP Startup Menu; F2 opens the UEFI diagnostics |
| Lenovo | ThinkPad | Enter then F1 (or F1 directly) | Enter then F12 (or F12 directly) | Enter opens the Startup Interrupt Menu |
| Lenovo | ThinkCentre, ThinkStation | F1 | F12 | |
| Lenovo | IdeaPad, Yoga, Legion (laptops) | F2 (or Fn + F2) | F12 (or Fn + F12) | "Novo" button (small hole near the power button) on many models: opens a menu with BIOS and boot menu |
| MSI | Motherboards, desktops, laptops | Del | F11 | |
| Gigabyte, Aorus | Motherboards and desktops | Del | F12 | |
| Gigabyte, Aorus | Laptops | F2 | F12 | |
| ASRock | Motherboards | F2 or Del | F11 | |
| Microsoft | Surface Pro 6 and later, Laptop 2 and later, Go 2 and later, Book 2 and 3 | Hold Volume + then press Power | Hold Volume − then press Power | Fully shut down the Surface first. For UEFI, release when the logo disappears; for USB, release when the dots spin under the logo. Older models differ |
| Apple | Intel Mac | No BIOS | Hold Option (⌥) at startup | Cmd + R for macOS Recovery |
| Apple | Apple Silicon Mac (M1 and later) | No BIOS | Hold the power button until the startup options appear | |
| Samsung | Galaxy Book, laptops | F2 | F10 (or Esc depending on the model) | As indicated by Samsung support |
| Toshiba, Dynabook | Satellite, Tecra, Portégé | F2 (or F1) | F12 | |
| Fujitsu | Lifebook, Esprimo | F2 | F12 | |
| LG | gram | F2 | F10 | |
| Huawei | MateBook | F2 | F12 | MateBook E and some MateBook (HZ): powered off, press Power + Volume + |
| Framework | Framework Laptop | F2 | F12 | |
| Intel | NUC | F2 | F10 | |

## If the key doesn't respond

Modern PCs boot so fast that the window to press the key is very short, especially with an SSD and Fast Startup enabled. Several solutions:

- **Tap the key repeatedly** as soon as you power on, instead of holding it.
- **Shut down completely** rather than restarting: with Windows Fast Startup, a "shutdown" is not a full shutdown. Holding **Shift** while clicking "Shut down" forces a full shutdown.
- On a laptop, try the **Fn** key (`Fn + F2`) when the function keys control volume or brightness by default.
- Use a **wired keyboard** plugged directly into the PC (some wireless keyboards or hubs are not recognized early enough).

## Enter UEFI from the operating system

On a PC that boots in UEFI mode, you can ask the system to restart directly into the firmware, without guessing the key.

**Windows 11 (interface)**: Settings > System > Recovery > Advanced startup > Restart now, then Troubleshoot > Advanced options > UEFI Firmware Settings.

**Windows 10 (interface)**: Settings > Update & Security > Recovery > Advanced startup > Restart now, then the same sequence of options.

**Windows (command line)**, in an elevated command prompt:

```
shutdown /r /fw /t 0
```

**Linux (systemd)**:

```
systemctl reboot --firmware-setup
```

## Boot menu or BIOS: which one to choose?

- The **boot menu** is used to choose the boot device *just once*: an installation USB drive, a diagnostic tool. It is the simplest way to reinstall a system.
- The **BIOS/UEFI** gives access to permanent settings: boot order, **Secure Boot**, **TPM**, virtualization, SATA mode, etc. This is where you enable, for example, the TPM 2.0 required by Windows 11 (see [Windows 10 end of support](/en/blog/windows-10-end-of-support-upgrade-to-windows-11/)).

## Warnings

- These keys were cross-checked against online sources, including the support pages of [ASUS](https://www.asus.com/support/faq/1008829), [Samsung](https://www.samsung.com/us/support/answer/ANS10002820/), Dell, Lenovo, Acer, Microsoft, Apple, LG, Huawei, Framework and Intel. They are the most common ones, but **they can vary with the exact model and year**: a manufacturer can change keys from one generation to the next. If it fails, check the manual or the model's support page, or try the other keys in the row (F2, Del, F12, Esc).
- A wrong change in the BIOS can prevent the PC from booting. Write down the original settings before changing them.
- On a company-managed PC, BIOS access may be **password-protected**. Don't try to bypass it without authorization: contact your IT department.
