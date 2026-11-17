# Dataset and provenance

Source: deterministic synthetic dataset authored locally for this project on 17 November 2026. No dataset was scraped, purchased or taken from an employer. No personal, banking, invoice or customer records are included. Dataset is released under CC0-1.0; code is MIT.

The fictional industrial portfolio covers packaging-line upgrade, warehouse automation, energy metering, quality traceability, a supplier portal and plant-network refresh. These names describe invented scenarios, not claims about a named business.

This project's `data/dataset.json` contains 6 independently reviewable assessment records. Its CSV contains the same source fields, with JSON used for nested activity networks. IDs are stable PPC keys. Project keys are logical labels, not database foreign keys into another project.

Finish-to-start dependencies only, zero lag, calendar days, positive integer durations and finish-exclusive intervals. Capacity is 100% per named resource per plan. Plans are independent resource pools; this does not perform cross-project resource levelling. Completion flags determine readiness, but the CPM dates describe the full baseline network, not remaining-duration forecasting. The activity network is edited as JSON on the planning record and is also supplied as a 36-row CSV.

The policies are deterministic. Matching synthetic outputs proves arithmetic/workflow agreement for these fixtures; it does not prove real-world savings, investment value, project delivery success or production readiness.
