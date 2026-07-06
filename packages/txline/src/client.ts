// The ONLY place that calls TxLINE (CLAUDE.md law). Consumers: worker-ingest, worker-jobs (proofs), replayer.
export class TxLineClient {
  constructor(private token = process.env.TXLINE_TOKEN!, private base = process.env.TXLINE_BASE_URL!) {}
  // fixtures(), streamOdds(onTick), streamScores(onEvent), proof(matchId), historical(matchId)
  // Fill from https://txline.txodds.com/documentation/quickstart — keep every endpoint used listed in docs/SUBMISSION.md.
}
