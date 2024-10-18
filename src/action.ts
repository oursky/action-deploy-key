import * as crypto from 'crypto';
import { inspect } from 'util';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as fs from 'fs/promises';

import { ActionInputs } from './inputs';

async function run() {
  try {
    const inputs = new ActionInputs();

    // Start the ssh-agent if needed
    if (!process.env.SSH_AGENT_PID) {
      const output = await exec.getExecOutput('ssh-agent -s');
      for (const line of output.stdout.split("\n")) {
        const matches = /^(SSH_AUTH_SOCK|SSH_AGENT_PID)=(.*); export \1/.exec(line);
        if (matches && matches.length > 0) {
          process.env[matches[1]] = matches[2];
          core.exportVariable(matches[1], matches[2]);
          console.log(`${matches[1]}=${matches[2]}`);
        }
      }
    } else {
        console.log(`Using existing SSH agent with PID ${process.env.SSH_AGENT_PID}`);
    }

    // Write the private key to a file and add it to the ssh-agent
    const sha256 = crypto.createHash('sha256').update(inputs.sshPrivateKey).digest('hex');
    const sshKeyPath = `${process.env.HOME}/.ssh/id_${sha256}`;
    await fs.mkdir(`${process.env.HOME}/.ssh`, { recursive: true });
    await fs.writeFile(sshKeyPath, inputs.sshPrivateKey + "\n", { mode: '600' });
    await exec.exec(`ssh-add ${sshKeyPath}`);

    // Add the ssh key to the ssh config
    const sshConfigEntry = '\n'
      + `Host key-${sha256}.github.com\n`
      + `  HostName github.com\n`
      + `  IdentityFile ${sshKeyPath}\n`
      + `  IdentitiesOnly yes\n`;
    await fs.appendFile(`${process.env.HOME}/.ssh/config`, sshConfigEntry);

    // Configure git to use the new ssh key for given repository
    await exec.exec(`git config --global --replace-all url."git@key-${sha256}.github.com:${inputs.repo}".insteadOf "https://github.com/${inputs.repo}"`);
    await exec.exec(`git config --global --add url."git@key-${sha256}.github.com:${inputs.repo}".insteadOf "git@github.com:${inputs.repo}"`);
    await exec.exec(`git config --global --add url."git@key-${sha256}.github.com:${inputs.repo}".insteadOf "ssh://git@github.com/${inputs.repo}"`);
  } catch (error) {
    core.info(inspect(error));
    core.setFailed(`Action failed with error: ${error}`);
  }
}

run();
