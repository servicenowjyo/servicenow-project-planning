# Hands-on: Project Planning

## Use what is already installed

1. Sign in yourself at https://<your-instance>.service-now.com/navpage.do. Never put credentials in the repository.
2. Open https://<your-instance>.service-now.com/u_project_planning.do. This page reads persisted records from your instance.
3. Read the summary and open a linked PPC record.
4. Edit a source field. For finance, amounts are INR paise (INR 1 = 100 paise); for governance, use the documented approval values; for planning, keep the task network valid JSON.
5. Click **Update**. Reopen the record. Its old result is cleared and status becomes **NEEDS_REVIEW**.
6. Click **Review planning**. The server validates the input, calculates results, writes the input snapshot/advice/result and shows **Review saved**. Alternatively, after editing an existing record, the Review button saves its posted source values and calculations together.
7. Return to the project page or reload it to see the persisted result.
8. Keep an original copy of edited values. Restore them after practice if you want exact fixture verification to pass. The verification intentionally fails when source data differs from the supplied fixture.

Example to discuss in an interview: PPC-P-001 starts 2026-11-18, lasts 10 calendar days and finishes at the exclusive boundary 2026-11-28, so it meets its 2026-11-27 deadline with 0 days slip. Its critical activities are A, B, D and F. C and E have two days of float. Engineer is allocated 200% on three baseline resource-days.

## Reinstall on a suitable developer instance

1. Review the scripts. They create/update only this project's named metadata and PPC synthetic fixtures; they do not delete data. Do not run them in production.
2. In **System Applications → Applications**, select **Global** and use **Switch to this Application**. This is different from just selecting Global in Scripts - Background.
3. Open **System Definition → Scripts - Background**. Verify its scope is Global, sandbox is off and Record for rollback is checked.
4. Paste/run `servicenow/01_schema.js`. Require **SCHEMA READY u_ppc_planning**.
5. Run `02_install_logic.js`. Require **INDEPENDENT LOGIC INSTALLED Project Planning**.
6. Run `03_seed_data.js`. It inserts missing fixture keys only and reviews this project's records. It preserves existing edits.
7. Run `05_install_workspace.js`, then open `/u_project_planning.do`.
8. Run `06_verify_workflow.js`. It temporarily edits one designated synthetic fixture and restores it in a finally block. Require **WORKFLOW VERIFICATION PASSED**. Use only with unchanged supplied fixtures.
9. Run read-only `04_verify.js`. Require **SOURCE EXACT** for both includes and **VERIFICATION PASSED Project Planning 6/6**.
10. Click the native **Review planning** button yourself and capture its success message.

Each folder is independent. Do not run files from the superseded combined builder. You do not need another project's code, table or page to run this one.
