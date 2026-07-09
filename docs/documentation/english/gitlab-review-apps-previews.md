---
description: Give every merge request a temporary, live preview of your Antora documentation, with a View app link and automatic cleanup.
---

# Set up per-merge-request preview environments with GitLab Review Apps

GitLab Review Apps give each merge request its own temporary, live copy of the documentation.
Reviewers read the rendered site instead of the raw diff.
This guide shows you how to deploy those previews from an Antora build, link them to the merge request, and let GitLab clean them up automatically.
Review Apps are available in all GitLab tiers.

This guide is for docs engineers who already have an Antora site building in GitLab CI.

The examples use a documentation repository for a fictional product, Red Apple Conference, modeled on a real platform.

## Prerequisites

- An Antora documentation repository that already builds in GitLab CI.
- Merge request pipelines enabled for the project, so jobs can run on `merge_request_event`.
- A static web host that the pipeline can publish files to and reviewers can reach.
  The publish command itself depends on your hosting, so the examples call placeholder scripts.

## Deploy each merge request to its own URL

A preview is an ordinary Antora build published under a per-merge-request path, such as `/reviews/42/`.
Add a `deploy-review` job that builds the site with that URL and publishes the result:

```yaml
deploy-review:
  stage: deploy
  image: node:22
  variables:
    REVIEW_URL: "https://docs.example.com/reviews/$CI_MERGE_REQUEST_IID/"
  script:
    - npm ci
    - npx antora antora-playbook.yml --url "$REVIEW_URL" --to-dir public
    # Replace with the command that copies public/ to your web host.
    - ./ci/publish-preview.sh public "reviews/$CI_MERGE_REQUEST_IID"
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
```

The `rules` keyword limits the job to merge request pipelines, so it never redeploys your published site.
`$CI_MERGE_REQUEST_IID` is the merge request number you see in its URL and title, so each preview gets a predictable path such as `reviews/42`.

The `--url "$REVIEW_URL"` flag overrides the production URL from the playbook and sets the preview URL as the Antora site URL.
Antora derives three things from the site URL: the redirect from the site root to the start page, the home link in the navigation bar, and the 404 page.
With the override, all three land inside `/reviews/42/` instead of on the production site.

## Link the preview to its merge request

The deploy job publishes the preview, but nothing links a reviewer to it yet.
Add an `environment` block so the merge request points at the deployment:

```yaml
deploy-review:
  # ...
  environment:
    name: review/$CI_MERGE_REQUEST_IID
    url: $REVIEW_URL
```

`environment.name` groups every preview under one `review` environment, with a separate deployment per merge request.
`environment.url` is the address GitLab attaches to the merge request.

GitLab adds a **View app** button to the merge request overview.

<!-- TODO: author captures this screenshot from a clean test project on gitlab.com, NOT from the internal GitLab (anonymization applies to images) -->

[//]: # (![The merge request overview with the View app button]&#40;/img/gitlab-view-app-button.png&#41;)

When the pipeline finishes, select **View app** to open the preview in your browser.

## Let GitLab clean up previews

A preview is only useful while its merge request is open.
Pair the environment with a stop job so GitLab knows how to remove a preview, and set `auto_stop_in` so it knows when.
The complete configuration:

```yaml
deploy-review:
  stage: deploy
  image: node:22
  variables:
    REVIEW_URL: "https://docs.example.com/reviews/$CI_MERGE_REQUEST_IID/"
  script:
    - npm ci
    - npx antora antora-playbook.yml --url "$REVIEW_URL" --to-dir public
    # Replace with the command that copies public/ to your web host.
    - ./ci/publish-preview.sh public "reviews/$CI_MERGE_REQUEST_IID"
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
  environment:
    name: review/$CI_MERGE_REQUEST_IID
    url: $REVIEW_URL
    on_stop: stop-review
    auto_stop_in: 7 days

stop-review:
  stage: deploy
  variables:
    GIT_STRATEGY: none
  script:
    # Replace the echo with the command that removes the preview
    # from your web host.
    - echo "Removing preview reviews/$CI_MERGE_REQUEST_IID"
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
      when: manual
  allow_failure: true
  environment:
    name: review/$CI_MERGE_REQUEST_IID
    action: stop
```

GitLab runs the stop job in two cases: when the merge request is merged or closed, and when no new deployment arrives for 7 days.
Each push to the merge request deploys again and resets the `auto_stop_in` timer, so active work keeps its preview.

The stop job points at the same environment with `action: stop` and must carry the same `rules` as the deploy job, so both land in the same pipelines.
`when: manual` keeps the job from running on its own, and `allow_failure: true` lets the pipeline finish without it.
`GIT_STRATEGY: none` skips the checkout, because the source branch may already be deleted when the job runs.
For the same reason, the removal command must not rely on files from the repository.

To see which previews are live, or to stop one early, open the project's **Environments** page and look under the `review` environment.

## Troubleshooting

When a preview doesn't work, the cause is usually in the job rules, the publish step, or the site URL.

### No View app button appears

The `deploy-review` job didn't run for the merge request.
Open the merge request pipeline and check that the job is there.
If it's missing, confirm that the job's `rules` match `merge_request_event` and that the project runs merge request pipelines.

### The preview URL returns 404

The publish step didn't put the site where `environment.url` points.
Check the job log to confirm the publish command ran, and compare its target path with the path in `$REVIEW_URL`.
The two must serve the same location.

### The preview redirects to the production site

Opening the preview root, such as `/reviews/42/`, sends the browser to the production site, or the home link in the navigation bar leaves the preview.
The playbook sets the production URL, so a build without the `--url` override writes production destinations into the site.
Build with `--url "$REVIEW_URL"`, and the start-page redirect and the home link resolve inside the preview again.
Page-to-page links inside the preview don't depend on the site URL, so they keep working either way.

<!-- TODO: author confirms from experience that redirect + home link + 404 is the complete list of what breaks without --url; consider whether sitemap/canonical URLs matter for previews -->

## Next steps

- [How a multi-repository Antora documentation platform fits together](antora-multi-repo-platform.md): see where this repository's pipeline sits in the wider build.
- [GitLab CI pipeline for an Antora documentation repository: a reference](gitlab-ci-pipeline-reference.md): look up every job, variable, and rule in the pipeline, including the review-app fields.
- [A branching and merge-request workflow for a documentation team](docs-team-branching-workflow.md): see the review process these previews support.
