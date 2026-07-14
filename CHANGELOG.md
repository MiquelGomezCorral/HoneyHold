## [1.1.0](https://github.com/MiquelGomezCorral/HoneyHold/compare/v1.0.0...v1.1.0) (2026-07-14)

### Features

* add from/to date range query params to backend list endpoints ([018663d](https://github.com/MiquelGomezCorral/HoneyHold/commit/018663dead9ad6aee195008a05fb01bb7091d3a3))
* add generic FilterPopover and DualRangeSlider components ([af5fecf](https://github.com/MiquelGomezCorral/HoneyHold/commit/af5fecff50bbe06dc55b97cc19a128fa67405a1d))
* add reusable search engine with fuzzy matching and field scoring ([5af7692](https://github.com/MiquelGomezCorral/HoneyHold/commit/5af769230c0cede238444ec0841332ab71fc43c3))
* wire search, faceted filters, amount range, and date range into transactions view ([96bdbb7](https://github.com/MiquelGomezCorral/HoneyHold/commit/96bdbb7413472d18deaf5f4d672e76a00af231cf))

### Bug Fixes

* match ledger search input height to button ([fa02172](https://github.com/MiquelGomezCorral/HoneyHold/commit/fa021724b69c6edc33fb3f16333a5072821eabed))
* prevent disabled buttons from being squeezed on press ([4892a8c](https://github.com/MiquelGomezCorral/HoneyHold/commit/4892a8c44abce9535a74ab6141a89dd9e1a54947))

## 1.0.0 (2026-07-14)

### Features

* add About modal with version info ([50c646c](https://github.com/MiquelGomezCorral/HoneyHold/commit/50c646c461b484f69871aa23365dbdc8d2522429))
* add backend PUT endpoints for editing transactions and transfers ([2f4bdc1](https://github.com/MiquelGomezCorral/HoneyHold/commit/2f4bdc19eb48f3c18c8f642fa52f179b71fa642c))
* add cross-profile transfer support ([2484fc3](https://github.com/MiquelGomezCorral/HoneyHold/commit/2484fc37908accfc888dfc1eb4033352003e8032))
* add custom DateField component with styled calendar popover ([2acb42a](https://github.com/MiquelGomezCorral/HoneyHold/commit/2acb42a6b036fe8a7722fbb9c188398939633a85))
* add input maxLength and zod validation ([8ef2304](https://github.com/MiquelGomezCorral/HoneyHold/commit/8ef2304ff0fad17f47a87516c18d6755ec1d4264))
* add squeezy press feedback to all buttons ([6181177](https://github.com/MiquelGomezCorral/HoneyHold/commit/6181177608fc50cebff03804ea18700f7ff39b20))
* add stable scrollbar with custom colors and hover transition ([aad464b](https://github.com/MiquelGomezCorral/HoneyHold/commit/aad464b6143c0f9701d677631ebce2a501d3b3b6))
* add table column widths and cell truncation ([922d758](https://github.com/MiquelGomezCorral/HoneyHold/commit/922d758fc564128a04f1a3e5abacf69cfff7703f))
* agents ([e88fdf8](https://github.com/MiquelGomezCorral/HoneyHold/commit/e88fdf810dda8b7de983d1ac2bcaf16f52022cb6))
* añade una prueba ([dbf62b2](https://github.com/MiquelGomezCorral/HoneyHold/commit/dbf62b218277b154be57d714858c940138d08d91))
* blur navbar background ([5e278b5](https://github.com/MiquelGomezCorral/HoneyHold/commit/5e278b5d0a03ec7d77a91d08960298d9e8e1c168))
* danger color ([55da88b](https://github.com/MiquelGomezCorral/HoneyHold/commit/55da88b8a48deb568e480f900ab98dbdf920986f))
* db update and initation 1.0 ([a768696](https://github.com/MiquelGomezCorral/HoneyHold/commit/a7686963d25a7d62b4b4b5ca572950fb7670b6a1))
* extend transaction modal with edit preload and split footer ([f0a30c4](https://github.com/MiquelGomezCorral/HoneyHold/commit/f0a30c44bb80dbad48fcae8e1a9c5e8fb3a1329a))
* make ledger rows clickable with hover cue ([e79a6a3](https://github.com/MiquelGomezCorral/HoneyHold/commit/e79a6a31ab8bd0d49ac66984dedd52eb5cd1eb5e))
* replace text arrows and white icons with black Icon components ([384dc98](https://github.com/MiquelGomezCorral/HoneyHold/commit/384dc9826e929a73ce0530bf950279e808b789b8))
* replace window.confirm with ConfirmModal component ([0a98140](https://github.com/MiquelGomezCorral/HoneyHold/commit/0a981409d6f0f56e2caed31def70d007848150b7))
* show cross-profile transfers as income/expense with sign ([f334254](https://github.com/MiquelGomezCorral/HoneyHold/commit/f33425451e8ac2391038f7cba2d94dbd28348fe8))

### Bug Fixes

* add hideBorder prop to Section component ([b5c3fd9](https://github.com/MiquelGomezCorral/HoneyHold/commit/b5c3fd9a19c004ad1a26c11365be8af16ba7f901))
* align counterparty max length with DB VARCHAR(128) ([f26b08e](https://github.com/MiquelGomezCorral/HoneyHold/commit/f26b08e59b61be6504b520900e0e61660a25e874))
* compatibility with missing data but with snapshots ([f8b80b4](https://github.com/MiquelGomezCorral/HoneyHold/commit/f8b80b48ed17cb53579247c7b952ccb5a5a85457))
* consistent danger-active variant for stop button and confirm modal ([a907bbc](https://github.com/MiquelGomezCorral/HoneyHold/commit/a907bbc31e13bbdb003006dc4485fbeb986d3f1c))
* exclude nav and link variants from Button pad classes ([22ede38](https://github.com/MiquelGomezCorral/HoneyHold/commit/22ede38a15f45b4915482b076594530329e5395e))
* filter button background and border styling ([3be212e](https://github.com/MiquelGomezCorral/HoneyHold/commit/3be212e6195448d7a667805c7446484bd157f4ad))
* include null-account transactions in dashboard aggregates ([1bc3977](https://github.com/MiquelGomezCorral/HoneyHold/commit/1bc3977b53950d463794180cb3e1df5e7f33de23))
* parse DB timestamps in Europe/Madrid timezone ([e874690](https://github.com/MiquelGomezCorral/HoneyHold/commit/e8746905c6447001cf9f7535db9efd73d95c4aba))
* remove stray semicolon after swap accounts button Icon ([d43b31e](https://github.com/MiquelGomezCorral/HoneyHold/commit/d43b31eb5d557d7649ca5355490d5f41ced8c02a))
* sticky table header with continuous border ([d16d5f5](https://github.com/MiquelGomezCorral/HoneyHold/commit/d16d5f5591171cdc2f9e639b1bc7c91b0669cf38))
* tag dropdown, profile optgroup label, and date picker hover in transaction modal ([e18b347](https://github.com/MiquelGomezCorral/HoneyHold/commit/e18b34780bdea46cfe8047a68026b7933605ea03))
