import * as crypto from 'crypto';
import { inspect } from 'util';
import * as fs from 'fs/promises';
import * as core from '@actions/core';
import * as exec from '@actions/exec';

import { ActionInputs } from './inputs';

async function cleanup() {
  try {
    const inputs = new ActionInputs();

    // Remove the ssh key from the ssh-agent
    const sha256 = crypto.createHash('sha256').update(inputs.sshPrivateKey).digest('hex');
    const sshKeyPath = `${process.env.HOME}/.ssh/id_${sha256}`;
    await exec.exec(`ssh-add -d ${sshKeyPath}`);
    await fs.unlink(sshKeyPath);

    // Remove the ssh key from the git config
    const sshConfigPath = `${process.env.HOME}/.ssh/config`;
    const sshConfig = await fs.readFile(sshConfigPath, 'utf8');
    const sshConfigEntry = '\n'
        + `Host key-${sha256}.github.com\n`
        + `  HostName github.com\n`
        + `  IdentityFile ${sshKeyPath}\n`
        + `  IdentitiesOnly yes\n`;
    await fs.writeFile(sshConfigPath, sshConfig.replace(
      sshConfigEntry,
      ''
    ));
  } catch (error) {
    core.info(inspect(error));
    core.setFailed(`Action failed with error: ${error}`);
  }
}

cleanup();
