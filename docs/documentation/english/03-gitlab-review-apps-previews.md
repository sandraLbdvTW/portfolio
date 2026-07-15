---
description: Give every merge request a temporary, live preview of your Antora documentation, served from CI artifacts, with a View app link and automatic cleanup.
---

# Set up per-merge-request preview environments with GitLab Review Apps

GitLab Review Apps give each merge request its own temporary, live copy of the documentation.
Reviewers read the rendered site along with the raw diff.
This guide shows you how to serve those previews straight from CI job artifacts—without a web server of your own—link them to the merge request, and let GitLab clean them up automatically.
Everything on this page works in all GitLab tiers.

This guide is for docs engineers who already have an Antora site building in GitLab CI.

The examples use a documentation repository for a fictional product, Red Apple Conference, modeled on a real platform.
The `red-apple` group hosts the published site on GitLab Pages, and GitLab serves the previews on the same Pages domain.

## Prerequisites

- An Antora documentation repository that already builds in GitLab CI.
- Merge request pipelines enabled for the project, so jobs can run on `merge_request_event`.
- GitLab Pages enabled on the instance—GitLab renders the previews on the Pages domain.
  GitLab.com has Pages enabled. If you have self-managed GitLab, ask your administrators.
- For a private or internal project, GitLab Pages access control enabled, so GitLab checks who may open a preview.

## Publish each merge request at its own URL

A preview is an ordinary Antora build that the job stores as artifacts—the files GitLab keeps after a job finishes.
GitLab itself serves those files, so the pipeline needs no publish step.
Add a `deploy-review` job:

```yaml
deploy-review:
  stage: deploy
  image: node:22
  variables:
    PREVIEW_URL: "https://red-apple.gitlab.io/-/docs/-/jobs/$CI_JOB_ID/artifacts/build/site"
  script:
    - npm ci
    - npx antora antora-playbook.yml --url "$PREVIEW_URL"
  artifacts:
    paths:
      - build/site
    expire_in: 7 days
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
```

The `rules` keyword limits the job to merge request pipelines, so it never touches your published site.
The job builds the site into Antora's default output directory, `build/site`, and stores that directory as artifacts.

GitLab renders artifact HTML only on the Pages domain.
That's why `PREVIEW_URL` points there, not at the GitLab host.

`PREVIEW_URL` assembles the preview address from four parts:

- `red-apple.gitlab.io`—the group's Pages domain.
  On self-managed GitLab, replace `gitlab.io` with your instance's Pages domain.
- `/-/docs`—the project, set off by `/-/`.
- `/-/jobs/$CI_JOB_ID/artifacts`—the artifacts of this job run.
  GitLab replaces `$CI_JOB_ID` with the job's numeric ID, so every push publishes a fresh preview at a new address.
- `/build/site`—the path inside the artifacts, which is the Antora output directory.

The `--url "$PREVIEW_URL"` flag overrides the production URL from the playbook and sets the preview URL as the Antora site URL.
Antora writes the site URL into the built pages—most visibly, into the home link on the site title in the navigation bar.
With the override, the home link stays inside the preview instead of leading to the production site.

:::note
On GitLab Premium and Ultimate, GitLab Pages parallel deployments can host each preview under its own path on the site's domain.
The artifact-served previews in this guide do the same work in every GitLab tier.
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

`environment.name` creates one environment per merge request, grouped under `review` on the **Environments** page.
`$CI_MERGE_REQUEST_IID` is the merge request number you see in its URL and title.
`environment.url` is the address GitLab attaches to the merge request.
It ends with `index.html` because the artifact browser serves files, not directories: a URL that stops at `build/site` returns 404.

GitLab adds a **View app** button to the merge request overview.
Each push runs a new job and gives the preview a new address.
The button always opens the latest build.

When the pipeline finishes, select **View app** to open the preview in your browser.

## Let GitLab clean up previews

A preview is only useful while its merge request is open.
Cleanup takes no extra job—two settings and one built-in behavior cover it.
The complete configuration:

```yaml
deploy-review:
  stage: deploy
  image: node:22
  variables:
    PREVIEW_URL: "https://red-apple.gitlab.io/-/docs/-/jobs/$CI_JOB_ID/artifacts/build/site"
  script:
    - npm ci
    - npx antora antora-playbook.yml --url "$PREVIEW_URL"
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
One exception works in your favor—GitLab keeps the most recent successful build of each branch past that expiry, so an open merge request doesn't lose its current preview while superseded builds expire.

The environment retires itself, too.
GitLab stops it when the merge request is merged or closed—no stop job required—and `auto_stop_in: 7 days` stops it when no new push arrives for a week.

To see which previews are live, open the project's **Environments** page and look under `review`.

## Troubleshooting

When a preview doesn't work, the cause is usually in the job rules, the artifact paths, or the site URL.

### No View app button appears

The `deploy-review` job didn't run for the merge request.
Open the merge request pipeline and check that the job is there.
If it's missing, confirm that the job's `rules` match `merge_request_event` and that the project runs merge request pipelines.

### The browser shows HTML source or downloads the file

The preview URL points at the GitLab host instead of the Pages domain, or the Pages domain isn't available.
GitLab renders artifact HTML only on the Pages domain, so check the host in `PREVIEW_URL` first.
If the host is right, confirm with your administrators that the instance has GitLab Pages enabled.
For a private project, also enable GitLab Pages access control in the project settings.

### The preview URL returns 404

The path in the URL doesn't match where the job stored the site, or the preview has expired.
Compare the path after `artifacts` in `PREVIEW_URL` with the job's `artifacts:paths` entry—both must name the same directory, `build/site`.
The URL must also end with a file, because a link that stops at a directory returns 404.
If the address is right, check the job's age: stored builds expire after the `expire_in` period.

### The preview links to the production site

The home link in the navigation bar—the link on the site title—leaves the preview.
The playbook sets the production URL, so a build without the `--url` override writes production destinations into the site.
Build with `--url "$PREVIEW_URL"`, and the home link resolves inside the preview again.
The start-page redirect and the page-to-page links are relative, so they work either way.

## Next steps

- [How a multi-repository Antora documentation platform fits together](01-antora-multi-repo-platform.md): see where this repository's pipeline sits in the wider build.
