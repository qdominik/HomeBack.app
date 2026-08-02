import assert from "node:assert/strict";
import test from "node:test";
import {
  QA_TEST_DATASET_TYPE,
  QA_TEST_DATA_PLAN,
  collectQaTestDataNames,
  isQaTestDataEnvironment,
  isSupportedTestDatasetType,
} from "../../src/lib/settings/qa-test-data";

test("QA test data is available only locally or in Vercel Preview", () => {
  assert.equal(
    isQaTestDataEnvironment({
      nodeEnv: "development",
      siteUrl: "http://localhost:3000",
    }),
    true,
  );
  assert.equal(
    isQaTestDataEnvironment({
      nodeEnv: "production",
      siteUrl: "https://homeback-app-git-preview.vercel.app",
      vercelEnv: "preview",
    }),
    true,
  );
  assert.equal(
    isQaTestDataEnvironment({
      nodeEnv: "production",
      siteUrl: "https://my.homeback.app",
      vercelEnv: "production",
    }),
    false,
  );
  assert.equal(
    isQaTestDataEnvironment({
      nodeEnv: "production",
      siteUrl: "https://my.homeback.app",
    }),
    false,
  );
});

test("QA smoke dataset is a supported test data type while unknown values are rejected", () => {
  assert.equal(isSupportedTestDatasetType(QA_TEST_DATASET_TYPE), true);
  assert.equal(isSupportedTestDatasetType("small"), true);
  assert.equal(isSupportedTestDatasetType("medium"), true);
  assert.equal(isSupportedTestDatasetType("deletion_test"), true);
  assert.equal(isSupportedTestDatasetType("production_seed"), false);
  assert.equal(isSupportedTestDatasetType(null), false);
});

test("QA smoke dataset names are deterministic and prefixed for idempotent lookup", () => {
  const names = collectQaTestDataNames();
  assert.equal(names.length, new Set(names).size);
  assert.ok(names.every((name) => name.startsWith("QA ")));
});

test("QA smoke dataset covers located, unlocated and archived item views", () => {
  const items = QA_TEST_DATA_PLAN.items;
  assert.ok(items.filter((item) => item.storageKey && item.status !== "archiwalne").length >= 3);
  assert.ok(items.filter((item) => !item.storageKey && item.status !== "archiwalne").length >= 2);
  assert.ok(items.filter((item) => item.status === "archiwalne").length >= 2);
});
