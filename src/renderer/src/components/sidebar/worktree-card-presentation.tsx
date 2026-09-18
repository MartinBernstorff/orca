import React from 'react'

import { getFlushWorktreeCardPaddingLeft } from './worktree-list/rows/indentation'
import { getWorktreeCardLinkedRefs } from './worktree-card-linked-refs'
import { WorktreeCardDetailsHover, WorktreeCardMetaBadges } from './WorktreeCardMeta'
import { WorktreeCardPortsDetails, WorktreeCardPortsTrigger } from './WorktreeCardPorts'
import type { WorktreeCardController } from './use-worktree-card-controller'

export function buildWorktreeCardPresentation(card: WorktreeCardController) {
  const {
    worktree,
    repo,
    inPinnedSection,
    hideRepoBadge,
    hostContextLabel,
    affiliateListMode,
    flushSurface,
    contentIndent,
    newCardStyle,
    compactCards,
    isFolder,
    detachedHeadDisplay,
    branch,
    folderMetaRowContent,
    showIdentityInNewCard,
    conflictOperation,
    cacheStartedAt,
    hasDetails,
    hasPorts,
    showInlineAgentList,
    showLineageChildChip,
    remoteBranchConflict,
    workspacePorts,
    metaIssue,
    metaLinearIssue,
    metaJiraIssue,
    metaReview,
    metaComment,
    prDisplay,
    metaAutomationProvenance,
    metaCliProvenance,
    linearIssue,
    linearIssueDisplay,
    showLinearIssue,
    showPR,
    handleEditIssue,
    handleEditComment,
    handleOpenGitHubIssueInOrca,
    handleOpenLinearIssueInOrca,
    handleOpenReviewInOrca,
    handleOpenAutomation,
    handleOpenAutomationRun,
    hasExplicitLinkedReview,
    handleUnlinkReview,
    detailsHoverControl,
    showDeleteQuickAction
  } = card

  // Why: pinned trees mix repos, so the repo icon shows regardless of groupBy's hideRepoBadge.
  const showPinnedRepoIcon = inPinnedSection && !!repo
  // Why: new card style retired the Compact/Detailed switch; repo identity uses the compact chip, not a lower pill.
  const showRepoIdentityInTitle = newCardStyle || compactCards
  const showInlineRepoBadge =
    showRepoIdentityInTitle && !!repo && !hideRepoBadge && !isFolder && !showPinnedRepoIcon
  const showRepoBadgeInMetaRow =
    !showRepoIdentityInTitle && !!repo && !hideRepoBadge && !showPinnedRepoIcon
  const showHostContextBadge = !compactCards && !!hostContextLabel
  const showDetachedHeadInMetaRow = !compactCards && !isFolder && detachedHeadDisplay !== null
  const showBranch =
    !isFolder &&
    branch.length > 0 &&
    !newCardStyle &&
    (!compactCards || branch !== worktree.displayName)
  // Why: rebases already surface in source control, so dense cards skip the persistent rebase chip.
  const showConflictOperationBadge =
    !!conflictOperation && conflictOperation !== 'unknown' && conflictOperation !== 'rebase'
  const hasMetadataBadge = showConflictOperationBadge
  const showTitleRowPrimary = compactCards && worktree.isMainWorktree && !isFolder
  const showMetaRowDetails = !newCardStyle && !compactCards && (hasDetails || hasPorts)
  const showTitleRowIndicators = compactCards && (hasDetails || hasPorts)
  // Why: grouped views can hide the repo badge; don't reserve a blank metadata lane unless there's real content.
  const hasDetailedMetaRowContent = Boolean(
    (showRepoBadgeInMetaRow && repo) ||
    showHostContextBadge ||
    folderMetaRowContent ||
    showBranch ||
    showIdentityInNewCard ||
    showDetachedHeadInMetaRow ||
    showConflictOperationBadge ||
    cacheStartedAt != null ||
    showMetaRowDetails
  )
  const hasMetaRow = compactCards
    ? hasMetadataBadge || cacheStartedAt != null
    : hasDetailedMetaRowContent
  const showBranchIdentityHover = compactCards && showBranch
  // Why: new card style has no details hover; only compact wraps its title in one.
  const titleWrapper =
    !newCardStyle && compactCards && (showBranchIdentityHover || hasDetails || hasPorts)
      ? (title: React.ReactElement): React.ReactElement => (
          <WorktreeCardDetailsHover
            issue={metaIssue}
            linearIssue={metaLinearIssue}
            jiraIssue={metaJiraIssue}
            review={metaReview}
            comment={metaComment}
            automationProvenance={metaAutomationProvenance}
            cliProvenance={metaCliProvenance}
            branchName={showBranchIdentityHover ? branch : undefined}
            workspaceTitle={worktree.displayName}
            identityOrder="branch-first"
            detailsAfter={hasPorts ? <WorktreeCardPortsDetails ports={workspacePorts} /> : null}
            openDelay={100}
            // Why: compact mode also renders the plug/badge hover root; sharing one open-state made hovering the
            // plug force-open the wider title card and race it closed (#9304), so let this title hover own its state.
            onEditIssue={affiliateListMode ? undefined : handleEditIssue}
            onEditComment={affiliateListMode ? undefined : handleEditComment}
            onOpenGitHubIssueInOrca={
              metaIssue && 'url' in metaIssue && metaIssue.url
                ? handleOpenGitHubIssueInOrca
                : undefined
            }
            onOpenLinearIssueInOrca={linearIssue?.url ? handleOpenLinearIssueInOrca : undefined}
            onOpenReviewInOrca={
              metaReview?.url && metaReview.provider === 'github'
                ? handleOpenReviewInOrca
                : undefined
            }
            onOpenAutomation={affiliateListMode ? undefined : handleOpenAutomation}
            onOpenAutomationRun={affiliateListMode ? undefined : handleOpenAutomationRun}
            // Why: compact mode hides the metadata badge row, so title hover carries the explicit-link affordance.
            onUnlinkReview={
              !affiliateListMode && hasExplicitLinkedReview ? handleUnlinkReview : undefined
            }
          >
            {title}
          </WorktreeCardDetailsHover>
        )
      : undefined
  // Why: sidebar rows need a small surface inset while content stays aligned with the pre-inset layout.
  const cardPaddingLeft = flushSurface
    ? getFlushWorktreeCardPaddingLeft(contentIndent)
    : contentIndent > 0
      ? `calc(0.125rem + ${contentIndent}px)`
      : null
  const cardStyle = cardPaddingLeft ? { paddingLeft: cardPaddingLeft } : undefined
  // Why: metadata badges only ever opened the details hover, which new card style no longer has;
  // an icon with nothing behind it is worse than no icon.
  const detailsAndPortsContent =
    !newCardStyle && (hasDetails || hasPorts) ? (
      <div className="flex shrink-0 items-center gap-1">
        {hasPorts && <WorktreeCardPortsTrigger ports={workspacePorts} />}
        {hasDetails && (
          <WorktreeCardMetaBadges
            issue={metaIssue}
            linearIssue={metaLinearIssue}
            jiraIssue={metaJiraIssue}
            review={metaReview}
            comment={metaComment}
            automationProvenance={metaAutomationProvenance}
            cliProvenance={metaCliProvenance}
            className="ml-0 pr-0"
          />
        )}
      </div>
    ) : null
  const detailsAndPorts = detailsAndPortsContent ? (
    <WorktreeCardDetailsHover
      issue={metaIssue}
      linearIssue={metaLinearIssue}
      jiraIssue={metaJiraIssue}
      review={metaReview}
      comment={metaComment}
      automationProvenance={metaAutomationProvenance}
      cliProvenance={metaCliProvenance}
      detailsAfter={hasPorts ? <WorktreeCardPortsDetails ports={workspacePorts} /> : null}
      hoverControl={detailsHoverControl}
      onEditIssue={affiliateListMode ? undefined : handleEditIssue}
      onEditComment={affiliateListMode ? undefined : handleEditComment}
      onOpenGitHubIssueInOrca={
        metaIssue && 'url' in metaIssue && metaIssue.url ? handleOpenGitHubIssueInOrca : undefined
      }
      onOpenLinearIssueInOrca={linearIssue?.url ? handleOpenLinearIssueInOrca : undefined}
      onOpenReviewInOrca={
        metaReview?.url && metaReview.provider === 'github' ? handleOpenReviewInOrca : undefined
      }
      onOpenAutomation={affiliateListMode ? undefined : handleOpenAutomation}
      onOpenAutomationRun={affiliateListMode ? undefined : handleOpenAutomationRun}
      // Why: branch lookup can surface a review without persisted metadata; only unlink when explicitly linked.
      onUnlinkReview={
        !affiliateListMode && hasExplicitLinkedReview ? handleUnlinkReview : undefined
      }
    >
      {detailsAndPortsContent}
    </WorktreeCardDetailsHover>
  ) : null
  const linkedRefs = getWorktreeCardLinkedRefs({
    linkedLinearIssue: worktree.linkedLinearIssue,
    linearIssueUrl: linearIssueDisplay?.url,
    prDisplay,
    showLinearIssue,
    showReview: showPR
  })
  // Why: linked refs own a row below the title so the workspace name keeps the full title width.
  const showLinkedRefsRow = linkedRefs.length > 0
  const showRefsRowDeleteQuickAction = showDeleteQuickAction && showLinkedRefsRow
  // Why: without refs there is no second row to sit next to, so delete stays in the title row
  // rather than opening a blank line on every card.
  const showHeaderDeleteQuickAction = showDeleteQuickAction && !showLinkedRefsRow
  const titleRowIndicators = showTitleRowIndicators ? (
    <div className="ml-auto flex shrink-0 items-center gap-1 pr-1.5">{detailsAndPorts}</div>
  ) : null
  const hasSecondaryCardContent =
    hasMetaRow ||
    showLinkedRefsRow ||
    !!remoteBranchConflict ||
    showInlineAgentList ||
    showLineageChildChip
  const titleOnlyCard = !hasSecondaryCardContent

  return {
    showPinnedRepoIcon,
    showInlineRepoBadge,
    showRepoBadgeInMetaRow,
    showHostContextBadge,
    showIdentityInNewCard,
    showDetachedHeadInMetaRow,
    showBranch,
    showConflictOperationBadge,
    showTitleRowPrimary,
    showMetaRowDetails,
    showTitleRowIndicators,
    hasMetaRow,
    showDeleteQuickAction,
    titleWrapper,
    cardStyle,
    detailsAndPorts,
    titleRowIndicators,
    linkedRefs,
    showLinkedRefsRow,
    showRefsRowDeleteQuickAction,
    showHeaderDeleteQuickAction,
    titleOnlyCard
  }
}

export type WorktreeCardPresentation = ReturnType<typeof buildWorktreeCardPresentation>
