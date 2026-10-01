# License, attribution and dependencies

Agent Continuity is licensed under the [MIT License](LICENSE).
Copyright (c) 2026 AAlpha7. Keep the copyright and permission notice with copies or substantial portions, as specified in LICENSE.

The runtime, example utilities, synthetic fixtures, tests, documentation and original SVG diagrams in this repository are distributed under that license. No private ledger, credentials, personal photographs, paper text or vendored package is included. The launch illustration contains referential product marks; these remain their owners’ property and are not relicensed under MIT. See [asset attribution](docs/assets/ATTRIBUTION.md).

## Source attribution

Maintained by [AAlpha7](https://github.com/AAlpha7). The four extracted runtime files and one adapted test are identified by source-blob and export hashes in [PROVENANCE.json](PROVENANCE.json), with explicit transformations. Additional example tools, regression tests and documentation accompany that extraction. The historical source checkout is not distributed; provenance verification against that checkout requires independently authorized access. Public users can validate the distributed files with MANIFEST.json and run all tests without it. Provenance hashes are evidence of byte consistency, not authenticated authorship.

## Dependency inventory

| Component | Distribution boundary |
| --- | --- |
| Runtime modules | Node.js built-ins only; no npm dependencies or install hooks |
| Tests and provenance helper | Node.js built-ins plus an independently installed Git executable |
| Node.js and Git | Neither executable, source distribution nor third-party runtime notices are bundled; install these separately under their respective licenses |
| SVG diagrams and docs | Original project assets, MIT; no external fonts or tracking resources |
| Launch illustration | Original composition; referential product marks excluded from MIT, with source links in the asset attribution |

No npm registry publication, hosted CI, model service or deployment is configured. `private: true` in package.json prevents accidental npm publication; it does not change this repository's MIT license or public visibility. No separate third-party notice was present in the extracted files or required for a bundled dependency, because no dependency distribution is included. Any later vendored code/assets must bring their applicable notices and permissions.
