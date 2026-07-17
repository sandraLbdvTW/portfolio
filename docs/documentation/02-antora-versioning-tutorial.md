---
description: Build a local two-version Antora site and learn how Git branches become documentation versions.
---

# Version your documentation with Antora branches

Antora builds documentation versions from Git branches or tags.
This tutorial uses branches.
Unlike a tag, a branch can still receive fixes after you publish the version.
Each branch becomes a separate version of your documentation, with its own entry in the site's version selector.

This tutorial is for technical writers who are new to Antora and want hands-on practice with documentation versioning.
It covers only the versioning workflow.
For everything else Antora can do, see the [official Antora documentation](https://docs.antora.org).

## What you'll build

This tutorial uses a fictional product, Red Apple Conference, modeled on a real platform.
You'll build a documentation site for one of its components, `docs-server`, with two versions:

- version 1.0, on branch `v1.0`
- version 2.0, on branch `v2.0`

The built site shows a version selector that let you switch between the two.
Everything runs on your computer.
You don't need a hosting account or a remote repository.

## Prerequisites

- Node.js, an active long-term support (LTS) release.
- Git.
- A terminal.
  The commands in this tutorial run unchanged in Bash, Zsh, and PowerShell.

## Set up the project

Create one folder that holds both the documentation repository and the Antora build.

1. Create the repository:

   ```shell
   mkdir docs-server
   cd docs-server
   git init -b main
   ```

2. Create a `.gitignore` so Git ignores the build output and the installed packages:

   ```
   build/
   node_modules/
   ```

3. Install Antora into the folder:

   ```shell
   npm init -y
   npm i -D -E antora
   ```

   The `-y` flag accepts all defaults.

   The second command installs Antora as a development dependency (`-D`) and pins the exact version (`-E`).

4. Confirm the install:

   ```shell
   npx antora -v
   ```

   ```
   @antora/cli: 3.1.15
   @antora/site-generator: 3.1.15
   ```

   Your version numbers may differ.

5. Commit the setup:

   ```shell
   git add .
   git commit -m "Set up the project"
   ```

## Create the documentation component

A component is Antora's unit of documentation: a folder tree with an `antora.yml` descriptor and at least one module.
The `antora.yml` file goes in the repository root.

1. Create a page at `modules/user-guide/pages/index.adoc`:

   ```asciidoc
   = Server User Guide

   This page describes version 1.0 of the server.
   ```

2. Create the navigation file at `modules/user-guide/nav.adoc`:

   ```asciidoc
   * xref:index.adoc[User guide]
   ```

3. In the repository root, create `antora.yml`:

   ```yaml
   name: docs-server
   title: Server
   version: '1.0'
   nav:
     - modules/user-guide/nav.adoc
   ```

   `name` identifies the component.
   Antora uses it in URLs and page IDs.

   `title` sets the component name readers see in the site.

   `version` states which documentation version these files describe.
   Quote the version so YAML reads it as text, not a number.

   `nav` lists the component's navigation files—here, the file you created in step 2.

4. Commit the component:

   ```shell
   git add .
   git commit -m "Add the user guide"
   ```

   Antora reads a local repository from its commits, so this commit matters.

The component now looks like this:

```
docs-server/
├── antora.yml
└── modules/
    └── user-guide/
        ├── nav.adoc
        └── pages/
            └── index.adoc
```

Your `package.json`, `package-lock.json` and `.gitignore` sit alongside `antora.yml` in the repository root.

## Add the playbook

You have the content.
To turn it into a site, Antora needs a playbook.

Two configuration files define the component version and the site build:

- `antora.yml`, one per component, in the repository root. You already created it. It names the component and its version.
- `antora-playbook.yml`, the playbook. It lists which branches to build, which UI to use, and the site's settings.

Keep the playbook in the repository root, next to `antora.yml`.

1. Create `antora-playbook.yml`:

   ```yaml
   site:
     title: Red Apple Conference Documentation
     start_page: docs-server:user-guide:index.adoc
   content:
     sources:
     - url: .
       branches: [v*]
   ui:
     bundle:
       url: https://gitlab.com/antora/antora-ui-default/-/jobs/artifacts/HEAD/raw/build/ui-bundle.zip?job=bundle-stable
   ```

   `url: .` points the build at the current repository.

   `branches: [v*]` selects which of its branches Antora builds.

   `ui.bundle.url` points to Antora's default UI, downloaded during the build.

   `start_page` is an Antora page ID: component, module, and page, separated by colons.
   The page ID omits the version segment, so Antora uses the latest version of the component.

2. Commit the playbook:

   ```shell
   git add .
   git commit -m "Add the Antora playbook"
   ```

## Build version 1.0

Antora builds one documentation version per Git branch.
Create the branch for version 1.0:

```shell
git branch v1.0
```

The playbook builds branches that match `v*`, so `v1.0` becomes version 1.0 of the site.
`main` stays free for the next version's work.

Nothing on `main` reaches the site until you give it a `v*` branch.

Build the site:

```shell
npx antora antora-playbook.yml
```

Antora writes the site to the `build/site` folder.
It prints a completion message:

```
Site generation complete!
Open file:///.../docs-server/build/site/index.html in a browser to view your site.
```

Open `build/site/index.html` in your browser.
The site opens on the user guide.
The version selector at the bottom of the navigation panel shows the component and its version, **Server 1.0**.
The version menu at the top of the page isn't visible yet: it appears only when a component has more than one version.

## Add a second version and rebuild

Version 2.0 starts on `main`, where the next version's work lives.

1. In `antora.yml`, change the version:

   ```yaml
   version: '2.0'
   ```

2. In `modules/user-guide/pages/index.adoc`, change the body text so the two versions differ visibly:

   ```asciidoc
   = Server User Guide

   This page describes version 2.0 of the server.
   ```

3. Commit the changes:

   ```shell
   git add .
   git commit -m "Update the guide for version 2.0"
   ```

4. Create the version branch:

   ```shell
   git branch v2.0
   ```

5. Rebuild the site:

   ```shell
   npx antora antora-playbook.yml
   ```

6. Refresh `build/site/index.html` in your browser.

The version selector at the bottom of the navigation panel now lists both versions, and the version menu appears at the top of the page.
Switch to 1.0: the page text changes back to the 1.0 wording.
Antora built that page from the `v1.0` branch.

:::note
Because the `branches` filter excludes the checked-out `main` branch, Antora reads each selected `v*` branch from its latest commit rather than from the worktree.
The relevant version branch must point to a commit that contains your change.
If a change is missing, see [Troubleshoot a versioned build](#troubleshoot-a-versioned-build).
:::

You built a versioned Antora site: two branches, two versions, a version selector to switch between them.
A production platform applies the same mechanism at scale: many component repositories, one central playbook, and automation that selects which `v*` branches to build.

## Troubleshoot a versioned build

When the built site doesn't show what you expect, check the Git side first.

### A version is missing from the selector

The playbook builds only branches that match the `branches: [v*]` filter.
List the branches that qualify:

```shell
git branch --list "v*"
```

```
  v1.0
  v2.0
```

If the branch is in the list, check its copy of `antora.yml`.
The selector shows the `version` value, not the branch name.
You can read a file from any branch without switching to it:

```shell
git show v1.0:antora.yml
```

### An edit doesn't appear on a page

The version branch probably doesn't contain the change.
Print the page exactly as Antora reads it:

```shell
git show v1.0:modules/user-guide/pages/index.adoc
```

If your edit is missing from the output, commit it to the version branch and rebuild the site.

## Next steps

- [How a multi-repository Antora documentation platform fits together](01-antora-multi-repo-platform.md): see how content repositories, a UI bundle, and a central playbook form one site.
