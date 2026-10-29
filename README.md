# IBITS CPQ Workbench for VS Code

Created by **Prudhvi Raju · Oracle ACE**.

The IBITS developer workspace, adapted for desktop VS Code: colorful Oracle CPQ metadata tables, REST inspection, JSON formatting and comparison, environment profiles, documentation and personal snippets.

## Install locally

1. In VS Code, open Extensions (`Ctrl+Shift+X`).
2. Choose **… → Install from VSIX…** and select `ibits-cpq-workbench-1.2.0.vsix`.
3. Open the Command Palette (`Ctrl+Shift+P`) and run **IBITS: Open CPQ Workbench**.
4. Choose **CPQ REST inspector → View sample metadata** to explore without credentials.

## Connect your CPQ tenant

Choose **Connect CPQ tenant**, enter your HTTPS site URL, and select a Bearer token or Basic authentication supported by your tenant. Credentials are entered through native VS Code prompts, not the webview. Choose session-only use or optional VS Code SecretStorage. The first retrieval verifies access. Tokens are supplied manually; automatic OAuth sign-in or refresh is not implemented.

Use your actual process and document variable names for attribute definitions. Document metadata exposes the exact `resourceVarName` needed for transaction requests. Enter transaction IDs as strings. Pricing and eligibility rules are supported presets; other rule families require a documented GET endpoint supported by your tenant. Permissions and API availability depend on your account and CPQ version.

Run **IBITS: Disconnect and Forget CPQ Credentials** to clear saved credentials. Saved environment profiles and personal snippets remain available.

## Features

### Configuration runtime — added in 1.2.0

Open **Configuration runtime**, connect your tenant, and enter the exact product family, product line and model variable names. The separate Configuration & BML lab can retrieve that product hierarchy.

1. Choose **Load cached configuration** and supply a `cacheInstanceId` obtained from a session available to your API account. This calls Oracle's POST `_loadData` operation, which reads that cache without executing rules.
2. Alternatively, choose **Start test configuration**, provide any initial `configData` inputs, review the request preview, and confirm the native VS Code prompt. The `_configure` operation launches a test configuration using cache ID `-1` and executes tenant logic. The returned cache ID is placed in the input automatically.
3. Pin the loaded response as a comparison baseline. Change the inputs and select **Run Configuration rules** to call `_update` after confirmation. This operates on the selected cache and can invoke tenant-defined integrations or side effects. Use a sandbox for testing.
4. Search the table or filter for errors, warnings, hidden attributes and actions. Inspect values, exact API paths, state flags, validation messages and metadata. Copy a row or export the entire response through a Save dialog.

Criteria always includes `state: true`. Use the Response criteria JSON to specify `fields`, `childDefs` or other supported query options when needed. Empty criteria follows the endpoint's defaults and does not promise every child collection. The optional metadata request retrieves model attribute definitions and joins top-level labels/types by exact `variableName`. A metadata permission failure does not hide a successful runtime response.

Example input shapes depend on your actual attributes: an input may be a scalar or an object containing `value` and `displayValue`. Use your tenant's metadata and API examples. The tool does not invent attribute names or automatically translate HTML IDs.

Unknown state flags display as a dash, never an assumed false. Nested returned array items retain paths, up to 12 levels and 5,000 rows. The raw response remains available within the 5 MB limit. Baseline comparison covers returned values and state; changes in requested fields can affect the comparison. It does not identify which individual rule caused a change, trace rule execution order, or provide line-by-line breakpoints. Changing model identity clears the cache input; starting a new configuration resets the baseline. Clearing local results does not delete the server cache, which follows the tenant's lifecycle.

Only the three named Configuration POST operations are allowed. No arbitrary POST, quote save, add-to-transaction, or deployment action is exposed. Native confirmation is required before `_configure` or `_update`; `_loadData` needs no extra prompt. A network failure after execution starts can leave session state uncertain—load the cache before retrying. Metadata reads use the existing GET handler.

Version 1.1.0 adds **Configuration & BML lab** to the navigation. Connect from within the lab, then choose a resource. Product family, line and model values are your site's exact variable names; none are hardcoded.

- Browse Configuration product families, lines, models, model attributes, array sets and layout attributes.
- Browse BML library functions, deployed functions and folders. Retrieve a single function using its exact `namespace.variableName` to see source, test script, parameters and Oracle-reported references.
- Search source by text with original line numbers, copy individual lines or complete code, and open source as an unsaved plain-text VS Code editor document.
- Open up to 30 local BML/BMLT, text, JSON, XML or JavaScript files (2 MB combined) for source inspection. Code is never executed on import.
- View possible dotted function references outside comments and quoted strings. These are lexical hints, not compiler-verified dependencies or a complete call graph.
- Download the tenant's Commerce BML/BMLT ZIP through Oracle's GET `/rest/v19/adminMeta` endpoint, using a native Save dialog. This endpoint is a Commerce Developer Toolkit export, not an export of every Configuration rule. Downloads are capped at 50 MB. Extract locally before selecting source files in the lab.

The lab performs inspection, not runtime execution: no breakpoints, Configuration session updates, rule-precedence simulation, BML debug POST calls or automatic enumeration of all rule types. For basic/declarative Configuration rules, use the Oracle admin view or an appropriate export. Source search covers the selected local file; record search covers the current API page, displaying up to 100 matches. Source reference display shows up to 500 hints.

- Attribute, document, action and array-set metadata; pricing and eligibility rules; transaction header and line data; custom REST GET paths.
- Colored type badges, boolean flags, filtering, sorting, expandable objects and raw response.
- Fifty-row display pages, next API page links, filtered CSV and page JSON export through VS Code's Save dialog.
- JSON validation, formatting and structural comparison.
- Local snippet library, environment profiles and official Oracle references.
- Responsive workspace and dark-theme adjustments.

Browser DOM inspection is not included: VS Code cannot inspect the active Chrome page. Keep the Chrome edition for that feature. Browser sessions, saved profiles and snippets are not automatically imported into this separate VS Code edition.

## Privacy and limits

Secrets stay in the extension host, in memory or VS Code SecretStorage if requested. They are sent only as authentication to the HTTPS tenant entered in native prompts. Redirects are blocked. Metadata requests use GET; Configuration runtime permits only `_loadData`, `_configure` and `_update` POST operations as described above. Requests have a 30-second timeout and 5 MB JSON response limit (50 MB for the Commerce archive). There are no telemetry or AI calls. Use a trusted workspace; Restricted Mode is unsupported.

Profiles and snippets are stored in VS Code global extension state. REST data remains in the webview memory until cleared or closed, unless exported. Exports include the current API page only. JSON numeric values use JavaScript precision; very large numeric identifiers in responses can lose precision. Session-only credentials last until disconnect or the extension host exits. Uninstalling is not a guaranteed credential wipe: use the forget command first.

## Develop and publish

Open this source folder in VS Code and press **F5** to start an Extension Development Host. There are no runtime npm dependencies. After edits to webview JavaScript or HTML, close and reopen the workbench; reload the development host after host code changes.

The VSIX is for local installation; it has not been published. `publisher: ibits` is a proposed Marketplace identifier, not a verified account. Before publication, use a publisher ID you own, choose the distribution license, verify live tenant access, and add Marketplace screenshots. Package with Microsoft's `@vscode/vsce`. Publishing requires your own Marketplace credentials.

## About IBITS

IBITS specializes in Oracle and Salesforce consulting, implementation, training and specialist staffing, including Oracle CPQ, Fusion / Cloud, EBS and cloud testing. [Company LinkedIn](https://www.linkedin.com/company/ib-its/) · [Website](https://invisiblebrains.com/).

Independent tool; not affiliated with or endorsed by Oracle or Microsoft.

## References

[Configuration runtime overview supplied for this update](https://help.bigmachines.com/cpq/?TocPath=BML%7C_____0#RestAPIs/cpqAPIs/configRunTime.htm) · [Load Configuration Data](https://docs.oracle.com/en/cloud/saas/configure-price-quote/cxcpq/op-rest-v19-configprodfamvarname-prodlinevarname-modelvarname-actions-_loaddata-post.html) · [Configure a Model](https://docs.oracle.com/en/cloud/saas/configure-price-quote/cxcpq/op-rest-v19-configprodfamvarname-prodlinevarname-modelvarname-actions-_configure-post.html) · [Update / execute rules](https://docs.oracle.com/en/cloud/saas/configure-price-quote/cxcpq/op-rest-v19-configprodfamvarname-prodlinevarname-modelvarname-actions-_update-post.html).

[Oracle CPQ Help](https://help.bigmachines.com/cpq) · [Configuration rule overview](https://help-cxsales.oraclecloud.com/cpq/Content/Configuration/Rules/ConfigurationRules.htm) · [BML library REST endpoints](https://docs.oracle.com/en/cloud/saas/configure-price-quote/cxcpq/api-bml-util-library-library-functions.html) · [Commerce BML archive download](https://docs.oracle.com/en/cloud/saas/configure-price-quote/cxcpq/op-rest-v19-adminmeta-get.html).

[VS Code webviews](https://code.visualstudio.com/api/extension-guides/webview) · [VSIX packaging](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) · [Oracle CPQ REST endpoints](https://docs.oracle.com/en/cloud/saas/configure-price-quote/cxcpq/rest-endpoints.html).

## Validation

This source snapshot does not include the automated test fixtures referenced in the original development notes. The package can be installed from source or packaged as a VSIX; validate it in a VS Code Extension Development Host and against a sandbox CPQ tenant before production use. The configuration runtime can execute tenant-defined rules and integrations, so use a sandbox for those operations.
