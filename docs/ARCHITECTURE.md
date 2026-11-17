# Architecture

`Editable ServiceNow fields → ProjectPlanningService.review → ProjectPlanningPolicy.planning → persisted input/result/advice → live UI Page`

The policy is plain ES5-style JavaScript with a guarded Node export. Node tests import the exact source file installed in the Script Include. The ServiceNow service reads typed form fields, validates required inputs, calls the policy and updates the record. The server UI Action displays a success or validation-error message and redirects to the same form. A before-insert/update Business Rule clears stale output when source values change without a new input snapshot. The UI Page checks administrator role and escapes values before rendering them.

ServiceNow table: `u_ppc_planning`. UI Page: `u_project_planning`. Script Includes: `ProjectPlanningPolicy`, `ProjectPlanningService`. No other project's include is called. No tasks, emails, payments, external requests, approval transactions or financial postings are generated.

Current form inputs and JSON network are intended for an administrator exercising the developer instance. No non-admin authorization test, concurrent-edit conflict test, audit-history retention design, import transactionality, holiday calendar or enterprise financial integration is claimed. The UI Page is a custom page, not a ServiceNow Configurable Workspace.
