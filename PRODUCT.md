# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Individual desktop users who want to unlock, browse, reveal, copy, and manage their saved credentials in a focused local application.

## Product Purpose

PixelPass is a desktop password manager. After a successful master-password login, users can retrieve safe entry metadata, filter their vault, reveal an individual password on demand, copy it, and add vault items.

## Operating Context

The product runs as a React renderer inside Electron and communicates with a Python backend through a constrained preload/IPC bridge. Decrypted secrets should be kept out of persistent renderer storage and cleared from UI state when their task ends.

## Capabilities and Constraints

- Preserve the existing master-password and Python-backend workflow.
- The password list exposes service and username metadata; a password is retrieved only when requested.
- Revealed passwords can be copied from a focused dialog.
- Demo data is temporary and clearly labeled.
- The native Electron outer frame and menu remain intact; the renderer owns the application styling.
- Backend request and response contracts remain explicit JSON actions.
- Product positioning beyond being a personal desktop password manager is currently undecided.

## Brand Commitments

- Product name: PixelPass.
- The renderer uses a faithful Windows 7 interface language through 7.css.
- A light furry personality is part of the product: restrained paw-print details and playful microcopy may appear without obscuring security, state, or task completion.
- Preserve the project's existing informal voice, including its "meow," "nyah," and "T~T" phrasing; do not normalize that language into generic product copy.
- Happy and shy states may also use `^w^`, `>///<`, and `>w<`; these faces are part of PixelPass's personality, not placeholder copy.

## Evidence on Hand

- The current React/Electron implementation and functional Vault dashboard are in `elelectron/src`.
- The project contains demo credential metadata for interaction testing, explicitly labeled as temporary.
- No commercial claims, testimonials, benchmarks, or production customer evidence are available and none should be fabricated.

## Product Principles

- Reveal secrets only when the user deliberately asks for them.
- Keep vault state and errors legible at every step.
- Let personality support trust and recognition without making security actions ambiguous.
- Preserve keyboard access and semantic controls while adopting the Windows 7 visual language.
- Keep demo behavior clearly separate from real vault data.

## Accessibility & Inclusion

Core vault actions, tabs, dialogs, form controls, and copy feedback must remain keyboard operable and screen-reader legible.
