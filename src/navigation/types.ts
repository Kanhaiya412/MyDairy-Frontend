export type RootDrawerParamList = {
  Dashboard: undefined;
  AddMilk: undefined;
  MilkRecord: undefined;

  AddCattle: undefined;
  CattleRecords: undefined;
  SoldCattleRecords: undefined;

  AddExpense: undefined;
  ExpenseRecord: undefined;

  AnimalManagement: undefined;

  LabourManagement: undefined;   // ⬅️ REQUIRED

  Payments?: undefined;
  Settings?: undefined;
};
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  FarmerHome: undefined;
  DairyOwnerHome: undefined;
  AdminHome: undefined;
ChatBot:undefined;

  LabourProfile: { labourId: number };
  LabourContract: { labourId: number };
 LabourLoan: { labourId: number; contractId?: number };
  LabourPenalty: { labourId: number };
  LabourAdvance: { labourId: number };
};
