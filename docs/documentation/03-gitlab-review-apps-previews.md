---
description: Give every merge request a temporary, live preview of your Antora documentation, served from CI artifacts, with a View app link and automatic cleanup.
---

# Set up per-merge-request preview environments with GitLab Review Apps

GitLab Review Apps give each merge request its own temporary, live copy of the documentation.
Reviewers read the rendered site along with the raw diff.

This guide is for docs engineers who already have an Antora site building in GitLab CI.
It shows you how to serve the previews straight from CI job artifacts, link them to the merge request, and let GitLab clean them up automatically.
You don't need a web server of your own.
Everything on this page works in all GitLab tiers.

The examples use a documentation repository for a fictional product, Red Apple Conference, modeled on a real platform.
GitLab serves the previews on the `red-apple` group's Pages domain, even if you host the production site elsewhere.

## Prerequisites

- An Antora documentation repository that already builds in GitLab CI.
- If `.gitlab-ci.yml` has `workflow:rules`, they must allow merge request pipelines (`merge_request_event`).
- GitLab Pages enabled on the instance—GitLab renders the previews on the Pages domain.
  GitLab.com has Pages enabled.
  If you have self-managed GitLab, ask your administrators.
- For a private or internal project, GitLab Pages access control turned on for the instance.
  Without it, the previews don't work.
  On self-managed GitLab, an administrator turns it on.

## Prepare a playbook for merge requests

Create a separate `antora-playbook.review.yml` file in the repository root:

```yaml
site:
  title: Red Apple Conference Documentation
  start_page: docs-server:user-guide:index.adoc
content:
  sources:
    - url: .
      branches: HEAD
ui:
  bundle:
    url: https://gitlab.com/antora/antora-ui-default/-/jobs/artifacts/HEAD/raw/build/ui-bundle.zip?job=bundle-stable
    snapshot: true
```

Replace `site.title` with your site's title and `site.start_page` with the ID of a page in this repository: the preview opens on that page.

`url: .` points to the local repository that GitLab Runner prepared for the job.
`branches: HEAD` builds what's currently in the working files.
That way, the preview contains the changes the pipeline runs for.

A production playbook with the `branches: [v*]` filter doesn't work here: it selects version branches, and a merge request branch usually doesn't match that filter.

## Publish a preview for each merge request

A preview is an ordinary Antora build that the job stores as artifacts—the files GitLab keeps after a job finishes.
GitLab itself serves those files, so the pipeline needs no publish step.
Add a `deploy-review` job to `.gitlab-ci.yml`.
If the file sets its own `stages` list, include the `deploy` stage in it.

```yaml
deploy-review:
  stage: deploy
  image: node:22
  variables:
    PREVIEW_URL: "https://red-apple.gitlab.io/-/docs/-/jobs/$CI_JOB_ID/artifacts/build/site"
  script:
    - npm ci
    - npx antora antora-playbook.review.yml
  artifacts:
    paths:
      - build/site
    expire_in: 7 days
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
```

The `rules` keyword limits the job to merge request pipelines, so it never touches your production site.
The job builds the site into Antora's default output directory, `build/site`, and stores that directory as artifacts.

GitLab renders artifact HTML only on the Pages domain.
That's why `PREVIEW_URL` points there, not at the GitLab host.

`PREVIEW_URL` consists of four parts:

- `red-apple.gitlab.io`—the group's Pages domain.
  On self-managed GitLab, replace `gitlab.io` with your instance's Pages domain.
- `/-/docs`—the project, set off by `/-/`.
- `/-/jobs/$CI_JOB_ID/artifacts`—the artifacts of this job run.
  GitLab replaces `$CI_JOB_ID` with the job's numeric ID, so every push publishes a fresh preview at a new address.
- `/build/site`—the path inside the artifacts, which is the Antora output directory.

The next step uses `PREVIEW_URL` for the link in the merge request.

:::note
If the site runs on GitLab Pages, parallel deployments on GitLab Premium and Ultimate can host each preview under its own path on the site's domain.
:::

## Link the preview to its merge request

The job publishes the preview, but nothing links a reviewer to it yet.
Add an `environment` block so the merge request points at the preview:

```yaml
deploy-review:
  # ...
  environment:
    name: review/$CI_MERGE_REQUEST_IID
    url: $PREVIEW_URL/index.html
```

`environment:name` creates one environment per merge request.
`$CI_MERGE_REQUEST_IID` is the merge request number you see in its URL and title.
`environment:url` is the address GitLab attaches to the merge request.
It ends with `index.html` because the artifact browser serves files, not directories: a URL that stops at `build/site` returns 404.

GitLab adds a **View app** button to the merge request overview.
Each push runs a new job and gives the preview a new address.
The button opens the latest successful build.

When the pipeline finishes, click **View app** to open the preview in your browser.

:::note
After you add `deploy-review`, a push to a merge request's branch can start two pipelines: a branch pipeline with your existing jobs and a merge request pipeline with `deploy-review`.
The merge request takes its pipeline status from the merge request pipeline, so checks that run only in branch pipelines, such as a build or a linter, no longer affect it.
To keep those checks in the merge request status, run them in merge request pipelines as well.
For details, see [Configure merge request pipelines](https://docs.gitlab.com/ci/pipelines/merge_request_pipelines/#configure-merge-request-pipelines).
:::

## Let GitLab clean up previews

A preview is useful only while its merge request is open.
Cleanup takes no extra job—two settings and one built-in behavior cover it.
Add `auto_stop_in: 7 days` to the `environment` block.
The complete configuration:

```yaml
deploy-review:
  stage: deploy
  image: node:22
  variables:
    PREVIEW_URL: "https://red-apple.gitlab.io/-/docs/-/jobs/$CI_JOB_ID/artifacts/build/site"
  script:
    - npm ci
    - npx antora antora-playbook.review.yml
  artifacts:
    paths:
      - build/site
    expire_in: 7 days
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
  environment:
    name: review/$CI_MERGE_REQUEST_IID
    url: $PREVIEW_URL/index.html
    auto_stop_in: 7 days
```

`artifacts:expire_in` deletes a stored build a week after its job finishes.
The exception is the most recent successful build of each branch, which GitLab keeps past that expiry.
An open merge request keeps its current preview, and superseded builds expire.

The environment stops automatically, too.
GitLab does this when the merge request is merged or closed, so you don't need a stop job.
`auto_stop_in: 7 days` stops it when no new push arrives for a week.

To see which previews are live, go to **Operate > Environments** in the project and look under `review`.

## Troubleshooting

When a preview doesn't work, the cause is usually in the job rules, the artifact paths, or the preview URL.

### No View app button appears

The `deploy-review` job didn't run for the merge request, or it failed.
Open the merge request pipeline and check that the job is there.
If it's missing, confirm that the job's `rules` match `merge_request_event` and that `workflow:rules`, if any, allow merge request pipelines.
If the job is there but failed, open its log: the button appears only after a successful deployment.

### The browser shows HTML source or downloads the file

The preview URL points at the GitLab host instead of the Pages domain, or the Pages domain isn't available.
GitLab renders artifact HTML only on the Pages domain, so check the host in `PREVIEW_URL` first.
If the host is right, confirm with your administrators that the instance has GitLab Pages enabled and, for a private or internal project, GitLab Pages access control turned on.

### The preview URL returns 404

The path in the URL doesn't match where the job stored the site, or the preview has expired.
Compare the path after `artifacts` in `PREVIEW_URL` with the job's `artifacts:paths` entry—both must name the same directory, `build/site`.
The URL must also end with a file, because a link that stops at a directory returns 404.
If the address is right, check the job's age: stored builds expire after the `expire_in` period.
If the artifacts don't contain `build/site/index.html`, look for the `Start page specified for site not found` warning in the job log: `site.start_page` points to a page that isn't in the build.

## Next steps

- [How a multi-repository Antora documentation platform fits together](01-antora-multi-repo-platform.md): see where this repository's pipeline sits in the wider build.
