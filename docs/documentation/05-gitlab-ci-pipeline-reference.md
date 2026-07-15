---
description: Look up what every job, variable, and rule in the GitLab CI pipeline of an Antora content repository does.
draft: true
---

# GitLab CI pipeline for an Antora documentation repository: a reference

One GitLab CI pipeline serves every content repository of a multi-repository Antora documentation platform.
The pipeline checks that the component builds, lints the prose, gives each merge request a live preview, and tells the central build to republish the site.
This reference describes each job, so you can look up what any field, variable, or rule does without reading the YAML end to end.

This reference is for maintainers who extend or debug the pipeline of a content repository.
For the platform around the pipeline, see [How a multi-repository Antora documentation platform fits together](01-antora-multi-repo-platform.md).

The examples use a documentation repository for a fictional product, Red Apple Conference, modeled on a real platform.

## Pipeline overview

The pipeline defines three stages:

```yaml
stages:
  - check
  - deploy
  - trigger
```

```mermaid
graph LR
    A["check<br/>build-check, lint"] --> B["deploy<br/>deploy-review, stop-review<br/>(merge requests only)"] --> C["trigger<br/>trigger-staging, trigger-production<br/>(main and v*.* only)"]
```

| Job | Stage | Purpose |
|---|---|---|
| [`build-check`](#build-check) | check | Builds the component standalone to catch broken builds early. |
| [`lint`](#lint) | check | Runs Vale and publishes findings as a code quality report. |
| [`deploy-review`](#review-app-jobs-deploy-review-and-stop-review) | deploy | Publishes a live preview of a merge request. |
| [`stop-review`](#review-app-jobs-deploy-review-and-stop-review) | deploy | Removes the preview. |
| [`trigger-staging`](#trigger-jobs-trigger-staging-and-trigger-production) | trigger | Rebuilds the staging site. |
| [`trigger-production`](#trigger-jobs-trigger-staging-and-trigger-production) | trigger | Rebuilds the production site. |

Two kinds of pipelines run these jobs: branch pipelines, started by a push, and merge request pipelines, started by opening or updating a merge request.
Each job's `rules` block decides which pipelines the job lands in; the [rules cheat sheet](#rules-cheat-sheet) sums them up.

## `build-check`

`build-check` answers one question on every push: does the component still build?
It builds the component alone, from the repository's own `antora-playbook.yml`—the same standalone build you create in [Version your documentation with Antora branches](02-antora-versioning-tutorial.md).

```yaml
build-check:
  stage: check
  image: node:22
  variables:
    GIT_CREDENTIALS: "https://oauth2:${DOCS_GROUP_TOKEN}@git.example.com"
  script:
    - npm ci
    - >
      npx antora --stacktrace --fetch antora-playbook.yml
      --ui-bundle-url "https://git.example.com/api/v4/projects/<PROJECT_ID>/jobs/artifacts/main/raw/build/ui-bundle.zip?job=ui-bundle&job_token=$CI_JOB_TOKEN"
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
      when: never
    - if: '$CI_PIPELINE_SOURCE == "push" || $CI_PIPELINE_SOURCE == "web"'
```

| Field | What it does |
|---|---|
| `image: node:22` | Antora runs on Node.js; `npm ci` installs the version pinned in `package.json`. |
| `GIT_CREDENTIALS` | Lets Antora fetch the private content repositories over HTTPS. See [Variables and artifacts](#variables-and-artifacts). |
| `--fetch` | Tells Antora to fetch the repository from the remote instead of reading the runner's checkout, so the build sees every `v*` branch. |
| `--stacktrace` | Prints the full error trace to the job log when the build fails. |
| `--ui-bundle-url` | Replaces the playbook's UI bundle with the bundle that the UI repository's pipeline built. |
| `rules` | Runs for pushes and manual runs, never in merge request pipelines, where `deploy-review` builds the same commit. |

The `--ui-bundle-url` value is a GitLab API call.
It downloads the `ui-bundle.zip` artifact of the latest `ui-bundle` job on the `main` branch of the UI repository, identified by `<PROJECT_ID>`.
`$CI_JOB_TOKEN` authenticates the download without storing an extra secret, as long as the UI repository lists the content repositories in its job token allowlist.

## `lint`

`lint` runs Vale, a prose linter, over the component's pages and converts the findings into GitLab's code quality format.

```yaml
lint:
  stage: check
  image: registry.example.com/docs/lint:1.2 # Vale and Asciidoctor
  allow_failure: true
  script:
    - >
      vale --output=styles/config/templates/code-quality.tmpl
      --glob="modules/**/{pages,partials}/**/*.adoc"
      --no-exit . > gl-code-quality-report.json
  artifacts:
    reports:
      codequality: gl-code-quality-report.json
    paths:
      - gl-code-quality-report.json
    when: always
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
    - if: '$CI_PIPELINE_SOURCE == "push" || $CI_PIPELINE_SOURCE == "web"'
```

| Field | What it does |
|---|---|
| `image` | An image with Vale and Asciidoctor, which Vale needs to read AsciiDoc. For Markdown sources, the official `jdkato/vale` image is enough. |
| `allow_failure: true` | A failed job—for example, after a broken style update—doesn't block the pipeline. |
| `--output` | A Go template that renders each finding in the code quality format. |
| `--glob` | Restricts Vale to pages and partials; navigation files and readmes aren't linted. |
| `--no-exit` | Vale exits with code 0 even when it finds errors, so findings alone never fail the job. |
| `reports.codequality` | Registers the JSON file as the pipeline's code quality report. |
| `paths` | Also uploads the report as a plain artifact, so you can download it from the job page in any tier. |
| `artifacts.when: always` | Uploads the report even when the job fails. |
| `rules` | Runs everywhere: pushes, manual runs, and merge requests all get findings. |

### Vale configuration

The repository root holds `.vale.ini`:

```ini
StylesPath = styles
MinAlertLevel = suggestion

IgnoredScopes = code, tt
SkippedScopes = script, style, pre, figure

[*.{adoc,asciidoc,asc}]
BasedOnStyles = RedApple, RedApple-adoc, RedApple-phrases, RedApple-ui
```

`StylesPath` points to the folder with the rule definitions, and `MinAlertLevel = suggestion` reports findings of every level.
Vale lints AsciiDoc by converting it to HTML, so both scope settings name HTML tags: `IgnoredScopes` keeps Vale away from inline code, and `SkippedScopes` skips block-level elements, including the `<pre>` blocks that listing and source blocks convert to.
The four `RedApple*` entries load the house style, split into general rules, AsciiDoc-source rules, phrasing rules, and UI-terminology rules.

### The code quality report

A report with one finding looks like this:

```json
[
  {
    "description": "Use 'Red Apple Conference' instead of 'RAC'.",
    "check_name": "RedApple-phrases.ProductName",
    "fingerprint": "5e7c3a1f9b2d4c6e",
    "severity": "minor",
    "location": {
      "path": "modules/user-guide/pages/index.adoc",
      "lines": { "begin": 12 }
    }
  }
]
```

GitLab requires at least these fields; extra properties from the CodeClimate format are ignored.
`severity` must be `info`, `minor`, `major`, `critical`, or `blocker`; the template maps Vale's alert levels—suggestion, warning, error—to these values.
`fingerprint` is any string that identifies the specific finding, such as a hash of its content.

:::note
Where findings appear—the merge request widget, the pipeline's **Code Quality** tab, or inline in the diff—depends on your GitLab tier and version; see the GitLab documentation on Code Quality.
:::

## Review app jobs: `deploy-review` and `stop-review`

In merge request pipelines, `deploy-review` builds the component with a per-merge-request site URL and publishes it as a live preview; `stop-review` removes the preview.
The how-to [Set up per-merge-request preview environments with GitLab Review Apps](03-gitlab-review-apps-previews.md) sets up the same review workflow with previews served from CI artifacts, which need no stop job; this pipeline publishes previews to the platform's own web host, so it adds one.
This section documents the fields of both jobs.

| Field | Job | What it does |
|---|---|---|
| `environment.name: review/$CI_MERGE_REQUEST_IID` | both | Creates one environment per merge request, grouped under the `review` prefix on the **Environments** page. |
| `environment.url` | `deploy-review` | The preview address; GitLab puts it behind the **View app** button in the merge request. |
| `auto_stop_in: 7 days` | `deploy-review` | Expires the preview a week after the last deployment; each new push resets the timer. |
| `on_stop: stop-review` | `deploy-review` | Names the job that stops the environment—on expiry, or when the merge request is merged or closed. |
| `action: stop` | `stop-review` | Marks the job as the environment's stop job instead of a deployment. |
| `GIT_STRATEGY: none` | `stop-review` | Skips the checkout, because the source branch may already be deleted when the job runs. |
| `when: manual`, `allow_failure: true` | `stop-review` | The job doesn't start on its own, and the pipeline doesn't wait for it. |
| `rules` | both | Both jobs run only in merge request pipelines and must carry identical rules, so they always land in the same pipeline. |

## Trigger jobs: `trigger-staging` and `trigger-production`

Publishing the site isn't this repository's job.
The playbook repository builds and publishes the whole site—the staging site from its `dev` branch and the production site from its `main` branch—so the last stage only tells it to rebuild.

```yaml
trigger-staging:
  stage: trigger
  needs: ["build-check"]
  trigger:
    project: docs/docs-playbook
    branch: dev
    strategy: depend
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
      when: never
    - if: '($CI_PIPELINE_SOURCE == "push" || $CI_PIPELINE_SOURCE == "web") && $CI_COMMIT_REF_NAME == "main"'
    - if: '($CI_PIPELINE_SOURCE == "push" || $CI_PIPELINE_SOURCE == "web") && $CI_COMMIT_REF_NAME =~ /^v\d+\.\d+$/'

trigger-production:
  stage: trigger
  needs: ["build-check"]
  trigger:
    project: docs/docs-playbook
    branch: main
    strategy: depend
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
      when: never
    - if: '($CI_PIPELINE_SOURCE == "push" || $CI_PIPELINE_SOURCE == "web") && $CI_COMMIT_REF_NAME =~ /^v\d+\.\d+$/'
```

| Field | What it does |
|---|---|
| `trigger.project`, `trigger.branch` | Starts a pipeline in the playbook repository on the given branch. |
| `strategy: depend` | The job waits for the triggered pipeline and takes its result, so a failed site build fails this pipeline instead of passing silently. |
| `needs: ["build-check"]` | The trigger fires as soon as the standalone build passes; `lint` findings never delay or block publishing. |
| `rules` | A push to `main` rebuilds staging, where writers review unreleased documentation. A push to a `v*.*` branch rebuilds both sites, because released versions appear on both. |

The user who pushes needs permission to start pipelines in the playbook repository; otherwise the trigger job fails.

## Variables and artifacts

The pipeline keeps one secret, and it lives outside the YAML:

| Variable | Where it's set | What it does |
|---|---|---|
| `DOCS_GROUP_TOKEN` | Masked CI/CD variable on the GitLab group | A group access token that can read the content repositories. Every repository in the group inherits it. |
| `GIT_CREDENTIALS` | `build-check` | The HTTPS credentials Antora uses to fetch content sources, composed from `DOCS_GROUP_TOKEN`. |
| `REVIEW_URL` | `deploy-review` | The public address of a merge request preview, derived from `$CI_MERGE_REQUEST_IID`. |

GitLab predefines the variables that the `rules` blocks read:

| Variable | Role in this pipeline |
|---|---|
| `CI_PIPELINE_SOURCE` | What started the pipeline: `push`, `web` (a manual run), or `merge_request_event`. |
| `CI_COMMIT_REF_NAME` | The branch name, matched against `main` and `/^v\d+\.\d+$/`. |
| `CI_MERGE_REQUEST_IID` | The merge request number; names the preview environment and its URL. |
| `CI_JOB_TOKEN` | A short-lived per-job token; authenticates the UI bundle download in `build-check`. |

The pipeline stores one artifact: `gl-code-quality-report.json` from `lint`.
`deploy-review` publishes the built site straight to the web host, so no job stores the site itself.

## Rules cheat sheet

Every `rules` block combines two questions: what started the pipeline, and on which branch.

| Event | Jobs that run |
|---|---|
| Push to a task branch | `build-check`, `lint` |
| Opening or updating a merge request | `lint`, `deploy-review`, and `stop-review` as a manual job |
| Push to `main` | `build-check`, `lint`, `trigger-staging` |
| Push to a `v*.*` branch | `build-check`, `lint`, `trigger-staging`, `trigger-production` |
| Manual run (**Run pipeline**) | Same as a push to the selected branch |

:::note
A push to a branch with an open merge request starts two pipelines at once: a branch pipeline and a merge request pipeline.
This is why `build-check` skips merge request pipelines—`deploy-review` already builds the same commit there.
:::

## Next steps

- [Set up per-merge-request preview environments with GitLab Review Apps](03-gitlab-review-apps-previews.md): build the two review app jobs step by step.
- [How a multi-repository Antora documentation platform fits together](01-antora-multi-repo-platform.md): see what the triggered central build assembles.
- [A branching and merge-request workflow for a documentation team](04-docs-team-branching-workflow.md): the branch roles behind the `main` and `v*.*` rules.
