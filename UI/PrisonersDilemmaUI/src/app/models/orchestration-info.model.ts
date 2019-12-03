export interface IOrchestrationInfo {
  id: string;
  purgeHistoryDeleteUri: string;
  rewindPostUri: string;
  sendEventPostUri: string;
  statusQueryGetUri: string;
  terminatePostUri: string;
}
