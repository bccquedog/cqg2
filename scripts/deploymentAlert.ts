#!/usr/bin/env ts-node
/**
 * CQG Deployment Alert System
 * Sends Discord notifications for build success/failure
 */

interface BuildInfo {
  status: 'success' | 'failure';
  commitHash: string;
  commitMessage: string;
  author: string;
  buildTime?: string;
  errorLog?: string;
  githubUrl?: string;
  vercelUrl?: string;
}

async function sendDiscordAlert(webhookUrl: string, buildInfo: BuildInfo): Promise<void> {
  const { status, commitHash, commitMessage, author, buildTime, errorLog, githubUrl, vercelUrl } = buildInfo;

  const isSuccess = status === 'success';
  const color = isSuccess ? 0x00ff00 : 0xff0000; // Green for success, Red for failure
  const emoji = isSuccess ? '✅' : '❌';
  const title = isSuccess ? 'Build Successful' : 'Build Failed';

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    {
      name: '📝 Commit',
      value: `\`${commitHash.substring(0, 7)}\``,
      inline: true,
    },
    {
      name: '👤 Author',
      value: author,
      inline: true,
    },
  ];

  if (buildTime) {
    fields.push({
      name: '⏱️ Build Time',
      value: buildTime,
      inline: true,
    });
  }

  fields.push({
    name: '💬 Message',
    value: commitMessage.substring(0, 100) + (commitMessage.length > 100 ? '...' : ''),
    inline: false,
  });

  if (!isSuccess && errorLog) {
    fields.push({
      name: '🚨 Error Details',
      value: `\`\`\`\n${errorLog}\n\`\`\``,
      inline: false,
    });
  }

  // Add links
  const links: string[] = [];
  if (githubUrl) {
    links.push(`[GitHub Commit](${githubUrl}/commit/${commitHash})`);
  }
  if (vercelUrl) {
    links.push(`[Vercel Dashboard](${vercelUrl})`);
  }
  if (links.length > 0) {
    fields.push({
      name: '🔗 Links',
      value: links.join(' • '),
      inline: false,
    });
  }

  const embed = {
    title: `${emoji} ${title}`,
    description: isSuccess 
      ? '🚀 Deployment completed successfully!' 
      : '⚠️ Deployment failed. Check error details below.',
    color,
    fields,
    timestamp: new Date().toISOString(),
    footer: {
      text: 'CQG Platform • Deployment Monitor',
    },
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'CQG Deploy Bot',
        embeds: [embed],
      }),
    });

    if (!response.ok) {
      console.error(`Discord webhook failed: ${response.status} ${response.statusText}`);
    } else {
      console.log(`✅ Discord alert sent successfully (${status})`);
    }
  } catch (error) {
    console.error('Failed to send Discord alert:', error);
  }
}

async function getGitInfo(): Promise<{ hash: string; message: string; author: string }> {
  const { execSync } = require('child_process');
  
  try {
    const hash = execSync('git rev-parse HEAD').toString().trim();
    const message = execSync('git log -1 --pretty=%B').toString().trim();
    const author = execSync('git log -1 --pretty=%an').toString().trim();
    
    return { hash, message, author };
  } catch (error) {
    console.error('Failed to get git info:', error);
    return {
      hash: 'unknown',
      message: 'No commit message',
      author: 'Unknown',
    };
  }
}

function extractErrorFromLog(logOutput: string): string {
  // Extract first 10 lines of error
  const lines = logOutput.split('\n').filter(line => line.trim().length > 0);
  const errorLines = lines.slice(0, 10);
  return errorLines.join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  const status = args[0] as 'success' | 'failure';
  const buildTime = args[1];
  const errorLog = args[2];

  if (!status || !['success', 'failure'].includes(status)) {
    console.error('Usage: ts-node deploymentAlert.ts <success|failure> [buildTime] [errorLog]');
    process.exit(1);
  }

  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('⚠️  ALERT_WEBHOOK_URL not set. Skipping Discord notification.');
    process.exit(0);
  }

  const gitInfo = await getGitInfo();
  const githubUrl = process.env.GITHUB_URL || 'https://github.com/natenasty21/cqg-platform';
  const vercelUrl = process.env.VERCEL_PROJECT_URL || 'https://vercel.com/dashboard';

  const buildInfo: BuildInfo = {
    status,
    commitHash: gitInfo.hash,
    commitMessage: gitInfo.message,
    author: gitInfo.author,
    buildTime,
    errorLog: errorLog ? extractErrorFromLog(errorLog) : undefined,
    githubUrl,
    vercelUrl,
  };

  await sendDiscordAlert(webhookUrl, buildInfo);
}

main().catch((error) => {
  console.error('Deployment alert script failed:', error);
  process.exit(1);
});

