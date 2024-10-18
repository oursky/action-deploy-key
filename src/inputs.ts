import * as core from '@actions/core';

export interface Inputs {
  sshPrivateKey: string;
  repo: string;
}

export class ActionInputs implements Inputs {
  get sshPrivateKey(): string {
    return core.getInput('ssh-private-key', { required: true });
  }

  get repo(): string {
    return core.getInput('repo', { required: true });
  }
}
