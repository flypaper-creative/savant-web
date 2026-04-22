/**
 * SAVANT_EXTRACTOR_v80.0.0
 * 
 * COMPREHENSIVE_SOURCE_ARCHIVAL_SYSTEM
 * 
 * This script performs a full-spectrum extraction of the Savant OS codebase.
 * It leverages elite-grade libraries for maximum efficiency and robustness.
 * 
 * WORKFLOW:
 * 1. Load environment credentials via dotenv.
 * 2. Collect source code within the specified scope using globby.
 * 3. Generate a comprehensive text artifact containing all source code.
 * 4. Append a detailed file tree visualization at the end.
 * 5. Save the artifact to a local .txt file.
 * 6. Push the changes to the designated GitHub repository.
 * 7. Upload the final artifact to an AWS S3 bucket using the ZAP protocol.
 */

import path from 'path';
import { globby } from 'globby';
import fs from 'fs-extra';
import { simpleGit, SimpleGit } from 'simple-git';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Octokit } from 'octokit';
import dotenv from 'dotenv';

// Initialize environment
dotenv.config();

interface ExtractorConfig {
  scope: string[];
  outputFile: string;
  githubRepo: string;
  s3Bucket: string;
  s3Key: string;
}

export class SavantExtractor {
  private git: SimpleGit;
  private s3: S3Client;
  private octokit: Octokit;

  constructor() {
    this.git = simpleGit();
    this.s3 = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
    this.octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  }

  /**
   * Generates a visual file tree for the given scope.
   */
  private async generateFileTree(scope: string[]): Promise<string> {
    const files = await globby(scope, {
      gitignore: true,
      ignore: ['node_modules/**', 'dist/**', '.git/**', 'archive/**', 'database.sqlite'],
    });

    let tree = 'FILE_TREE_MANIFEST:\n';
    const sortedFiles = files.sort();
    
    sortedFiles.forEach(file => {
      const depth = file.split('/').length - 1;
      const indent = '  '.repeat(depth);
      tree += `${indent}└── ${path.basename(file)}\n`;
    });

    return tree;
  }

  /**
   * Collects source code from all files in the scope.
   */
  private async collectSourceCode(scope: string[]): Promise<string> {
    const files = await globby(scope, {
      gitignore: true,
      ignore: ['node_modules/**', 'dist/**', '.git/**', 'archive/**', 'database.sqlite', '*.sqlite', '*.png', '*.jpg', '*.jpeg', '*.gif', '*.ico', '*.pdf'],
    });

    let sourceContent = `SAVANT_SOURCE_CODE_DUMP // v80.0.0\n`;
    sourceContent += `TIMESTAMP: ${new Date().toISOString()}\n`;
    sourceContent += `ARCHIVE_ID: ${Math.random().toString(36).substring(2, 15).toLowerCase()}\n`;
    sourceContent += `================================================================================\n\n`;

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        sourceContent += `FILE: ${file}\n`;
        sourceContent += `--------------------------------------------------------------------------------\n`;
        sourceContent += content;
        sourceContent += `\n\n================================================================================\n\n`;
      } catch (err) {
        console.warn(`[SKIP] Could not read file: ${file}`);
      }
    }

    return sourceContent;
  }

  /**
   * Executes the full extraction and archival sequence.
   */
  public async execute(config: ExtractorConfig): Promise<void> {
    console.log('--- INITIATING_SAVANT_EXTRACTION_SEQUENCE_v80 ---');

    try {
      // 1. Collect Source Code
      console.log('[1/7] Collecting source code...');
      const sourceCode = await this.collectSourceCode(config.scope);
      
      // 2. Generate File Tree
      console.log('[2/7] Generating file tree...');
      const fileTree = await this.generateFileTree(config.scope);
      
      // 3. Combine Artifacts
      console.log('[3/7] Combining artifacts...');
      const finalArtifact = `${sourceCode}\n\n${fileTree}`;
      
      // 4. Save to Local File
      console.log('[4/7] Saving to local file...');
      await fs.ensureDir(path.dirname(config.outputFile));
      await fs.writeFile(config.outputFile, finalArtifact);
      console.log(`[SUCCESS] Artifact saved to: ${config.outputFile}`);

      // 5. Push to GitHub
      if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) {
        console.log('[5/7] Pushing to GitHub...');
        try {
          await this.git.add(config.outputFile);
          await this.git.commit(`SAVANT_ARCHIVE_UPDATE: ${new Date().toISOString()}`);
          await this.git.push();
          console.log('[SUCCESS] Artifact pushed to GitHub.');
        } catch (gitErr) {
          console.error('[ERROR] GitHub push failed:', gitErr);
        }
      } else {
        console.log('[SKIP] GitHub credentials missing.');
      }

      // 6. Upload to S3 (ZAP Protocol)
      if (process.env.AWS_S3_BUCKET) {
        console.log('[6/7] Uploading to S3 (ZAP Protocol)...');
        const command = new PutObjectCommand({
          Bucket: config.s3Bucket,
          Key: config.s3Key,
          Body: finalArtifact,
          ContentType: 'text/plain',
        });
        await this.s3.send(command);
        console.log(`[SUCCESS] Artifact uploaded to S3: ${config.s3Bucket}/${config.s3Key}`);
      } else {
        console.log('[SKIP] S3 credentials missing.');
      }

      console.log('[7/7] Sequence finalized.');
      console.log('--- EXTRACTION_SEQUENCE_COMPLETE ---');
    } catch (error) {
      console.error('[CRITICAL_FAILURE] Extraction sequence aborted:', error);
      throw error;
    }
  }
}

// Self-executing if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const extractor = new SavantExtractor();
  extractor.execute({
    scope: ['src/**', 'server.ts', 'package.json', 'tsconfig.json', 'vite.config.ts', '.env.example', 'index.html'],
    outputFile: './archive/savant_source_dump.txt',
    githubRepo: process.env.GITHUB_REPO || '',
    s3Bucket: process.env.AWS_S3_BUCKET || '',
    s3Key: `archives/savant_dump_${Date.now()}.txt`,
  }).catch(console.error);
}
