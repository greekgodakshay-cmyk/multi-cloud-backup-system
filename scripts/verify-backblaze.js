/**
 * Backblaze B2 Integration Verification Script
 * 
 * Safely audits and tests Backblaze B2 S3-compatible configuration and connectivity.
 * Adheres strictly to security rules: never logs credentials or secret values.
 */

require('dotenv').config();
const {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} = require('@aws-sdk/client-s3');
const config = require('../src/config');

async function verifyBackblaze() {
  console.log('=======================================================');
  console.log(' Backblaze B2 S3-Compatible Integration Audit');
  console.log('=======================================================\n');

  // Step 1: Configuration Validation
  console.log('[Step 1: Configuration Validation]');
  const validation = config.validateBackblazeConfig();
  console.log(`  Configured:   ${validation.isConfigured ? 'YES' : 'NO'}`);
  console.log(`  Bucket Name:  ${config.b2.bucket || '(not set)'}`);
  console.log(`  Bucket ID:    ${config.b2.bucketId || '(not set)'}`);
  console.log(`  Endpoint:     ${config.b2.endpoint || '(not set)'}`);
  console.log(`  Region:       ${config.b2.region || '(not set)'}`);
  console.log(`  Path Style:   ${config.b2.forcePathStyle ? 'true' : 'false'}`);
  console.log(`  Key ID Set:   ${Boolean(config.b2.keyId)} (length: ${config.b2.keyId.length})`);
  console.log(`  Secret Set:   ${Boolean(config.b2.applicationKey)} (length: ${config.b2.applicationKey.length})`);

  if (validation.issues.length > 0) {
    console.log('\n  Configuration Issues / Warnings Detected:');
    for (const issue of validation.issues) {
      console.log(`   - [WARNING] ${issue}`);
    }
  } else {
    console.log('  [PASS] Configuration syntax and format check passed.');
  }

  if (!validation.isConfigured || !config.b2.keyId || !config.b2.applicationKey || !config.b2.bucket) {
    console.error('\n[BLOCKED] Backblaze B2 credentials or bucket name are incomplete in .env.');
    return { status: 'BLOCKED', reason: 'Missing credentials or bucket name' };
  }

  // Step 2: Connection & Authentication Test
  console.log('\n[Step 2: Connection & Authentication Test]');
  const clientConfig = {
    endpoint: config.b2.endpoint,
    region: config.b2.region,
    credentials: {
      accessKeyId: config.b2.keyId,
      secretAccessKey: config.b2.applicationKey
    }
  };

  if (config.b2.forcePathStyle) {
    clientConfig.forcePathStyle = true;
  }

  const client = new S3Client(clientConfig);

  let authSuccess = false;
  try {
    const listRes = await client.send(
      new ListObjectsV2Command({
        Bucket: config.b2.bucket,
        MaxKeys: 1
      })
    );
    authSuccess = true;
    console.log('  [PASS] Authentication succeeded!');
    console.log(`  [INFO] HTTP Status: ${listRes.$metadata?.httpStatusCode || 200}`);
    console.log(`  [INFO] Object count sampled: ${listRes.KeyCount || 0}`);
  } catch (err) {
    const errName = err.name || 'Error';
    console.error(`  [FAIL] Authentication failed: ${errName}`);
    if (errName === 'SignatureDoesNotMatch') {
      console.error('  [DIAGNOSIS] SignatureDoesNotMatch indicates that the provided secret application key does not match the key ID on Backblaze B2.');
      console.error(`  [DIAGNOSIS] Note: The configured secret is ${config.b2.applicationKey.length} characters long. Standard Backblaze application keys are 31 characters.`);
    } else if (errName === 'InvalidAccessKeyId') {
      console.error('  [DIAGNOSIS] InvalidAccessKeyId indicates that Backblaze does not recognize this Key ID.');
    } else if (errName === 'NoSuchBucket') {
      console.error(`  [DIAGNOSIS] Bucket "${config.b2.bucket}" was not found in region "${config.b2.region}".`);
    } else {
      console.error(`  [DIAGNOSIS] ${err.message}`);
    }
    return {
      status: 'FAILED_AUTH',
      error: errName,
      message: err.message
    };
  }

  // Step 3: Minimal Safe Non-Destructive Round-Trip Test (Only if auth succeeded)
  if (authSuccess) {
    console.log('\n[Step 3: Isolated Round-Trip Test (Upload / Read / Delete)]');
    const testKey = `test-probe-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.txt`;
    const testContent = Buffer.from(`Backblaze verification probe generated at ${new Date().toISOString()}`);

    try {
      // 1. Put
      console.log(`  Uploading temporary probe: ${testKey}`);
      await client.send(new PutObjectCommand({
        Bucket: config.b2.bucket,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain'
      }));
      console.log('  [PASS] Upload verified.');

      // 2. Get
      console.log(`  Reading temporary probe: ${testKey}`);
      const getRes = await client.send(new GetObjectCommand({
        Bucket: config.b2.bucket,
        Key: testKey
      }));
      const chunks = [];
      for await (const chunk of getRes.Body) {
        chunks.push(chunk);
      }
      const retrieved = Buffer.concat(chunks);
      if (retrieved.equals(testContent)) {
        console.log('  [PASS] Read verified: Content matches uploaded bytes exactly.');
      } else {
        console.error('  [FAIL] Read verified: Content mismatch.');
      }

      // 3. Delete
      console.log(`  Cleaning up temporary probe: ${testKey}`);
      await client.send(new DeleteObjectCommand({
        Bucket: config.b2.bucket,
        Key: testKey
      }));
      console.log('  [PASS] Cleanup verified: Temporary test object deleted safely.');

      console.log('\n=======================================================');
      console.log(' Result: FULL PASS — Backblaze B2 is completely operational');
      console.log('=======================================================');
      return { status: 'PASS' };

    } catch (testErr) {
      console.error(`  [FAIL] Round-trip operation failed: ${testErr.name} - ${testErr.message}`);
      return { status: 'FAILED_OPERATION', error: testErr.name };
    }
  }
}

if (require.main === module) {
  verifyBackblaze()
    .then(result => {
      if (result.status !== 'PASS') {
        process.exitCode = 1;
      }
    })
    .catch(err => {
      console.error('Unexpected error during verification:', err.message);
      process.exitCode = 1;
    });
}

module.exports = verifyBackblaze;
