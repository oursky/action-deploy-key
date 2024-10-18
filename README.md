# `deploy-key` Github Action

> A Github Action to add a deploy key to a repository

Currently `action/checkout` does not natively support checking out submodules with deploy keys ([issue](https://github.com/actions/checkout/issues/287)).

This action pairs specified repository and ssh key. No extra configuration is needed for subqequent `actions/checkout` to checkout submodules.

## Prerequisites

For example if you want to clone `oursky/private-repo-child` inside `oursky/private-repo-parent`:

1. Generate a deploy key for `oursky/private-repo-child` with read access.
2. Add the deploy key to `oursky/private-repo-parent`'s secrets.

## Usage

```yaml
- uses: oursky/action-deploy-key@v0
  with:
    repo: oursky/private-repo-child
    ssh-private-key: ${{ secrets.DEPLOY_KEY_FOR_PRIVATE_REPO_CHILD }}

- uses: actions/checkout@v3
  with:
    submodules: true
```

### Inputs

- `repo` (required): The repository to add the deploy key to.
- `ssh-private-key` (required): The deploy key.

## Credits

- [webfactory/ssh-agent](https://github.com/webfactory/ssh-agent)
