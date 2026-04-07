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

  LabourManagement: undefined;

  Payments?: undefined;
  Settings?: undefined;
};
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  FarmerHome: undefined;
  DairyOwnerHome: undefined;
  AdminHome: undefined;
  ChatBot: undefined;
     LabourManagement: undefined;
  LabourProfile: { labourId: number };
  LabourLoan: { labourId: number; contractId?: number };
  LabourPenalty: { labourId: number };
  LabourAdvance: { labourId: number };
  LabourAttendance: { labourId: number };
  LabourSalary: { labourId: number };
};

/**
 * ✅ Combined navigation list
 * Drawer screen can navigate to Stack screens safely using this.
 */
export type RootNavigationParamList = RootDrawerParamList & RootStackParamList;
