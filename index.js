const core = require('@actions/core')
const github = require('@actions/github')

// check if this is running on a pull request
if (!github.context.payload.pull_request) {
  return core.setOutput('passed', true)
}

const token = core.getInput('githubToken');
const context = github.context
const octokit = github.getOctokit(token)

const hasSomeInput = core.getInput('hasSome')
const hasAllInput = core.getInput('hasAll')
const hasNoneInput = core.getInput('hasNone')
const hasNotAllInput = core.getInput('hasNotAll')
const forceMergeLabel = core.getInput('forceMerge')

const hasSomeLabels = hasSomeInput.split(',')
const hasAllLabels = hasAllInput.split(',')
const hasNoneLabels = hasNoneInput.split(',')
const hasNotAllLabels = hasNotAllInput.split(',')

const failMessages = []


const prLabels = context.payload.pull_request.labels.map(item => item.name)

const hasSomeResult = !hasSomeInput || hasSomeLabels.some((label) =>
  prLabels.includes(label)
)

const hasAllResult = !hasAllInput || hasAllLabels.every((label) =>
  prLabels.includes(label)
)

const hasNoneResult = !hasNoneInput || hasNoneLabels.every((label) =>
  !prLabels.includes(label)
)

const hasNotAllResult = !hasNotAllInput || hasNotAllLabels.some((label) =>
  !prLabels.includes(label)
)

if (!hasSomeResult) {
  failMessages.push(`The PR needs to have at least one of the following labels to pass this check: ${hasSomeLabels.join(
    ', '
  )}`)
}

if (!hasAllResult) {
  failMessages.push(`The PR needs to have all of the following labels to pass this check: ${hasAllLabels.join(
    ', '
  )}`)
}

if (!hasNoneResult) {
  failMessages.push(`The PR needs to have none of the following labels to pass this check: ${hasNoneLabels.join(
    ', '
  )}`)
}

if (!hasNotAllResult) {
  failMessages.push(`The PR needs to not have at least one of the following labels to pass this check: ${hasNotAllLabels.join(
    ', '
  )}`)
}

async function run () {
  if (forceMergeLabel && !prLabels.includes(forceMergeLabel)) {
    const repoTopics = await octokit.repos.getAllTopics({
      owner: context.repo.owner,
      repo: context.repo.repo,
    })
    const baseBranchName = context.payload.pull_request.base.ref
    if (repoTopics.data.names.includes(`lock-${baseBranchName}`)) {
      failMessages.push(
        `The base branch ${baseBranchName} is locked, and the PR does not have label` +
        ` ${forceMergeLabel}`,
      )
    }
  }

  const checks = await octokit.checks.listForRef({
    ...context.repo,
    ref: context.payload.pull_request.head.ref,
  });

  const checkRunIds = checks.data.check_runs.filter(check => check.name === context.job).map(check => check.id)

  if (failMessages.length) {
    // update old checks
    for (const id of checkRunIds) {
      await octokit.checks.update({
        ...context.repo,
        check_run_id: id,
        conclusion: 'failure',
        output: {
          title: 'Labels did not pass provided rules',
          summary: failMessages.join('. ')
        }
      })
    }

    core.setFailed(failMessages.join('. '))
  } else {
    // update old checks
    for (const id of checkRunIds) {
      await octokit.checks.update({
        ...context.repo,
        check_run_id: id,
        conclusion: 'success',
        output: {
          title: 'Labels follow all the provided rules',
          summary: ''
        }
      })
    }

    core.setOutput('passed', true)
  }
}

run()
