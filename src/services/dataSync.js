// Compatibility module. Browser sync now consumes validated, sanitized public
// snapshots; the official Burning Man API is accessed only by the build pipeline.
export {
  syncYear,
  syncType,
  getSyncMetadata,
  getSyncStatus,
  clearYear
} from './staticDataSync'
