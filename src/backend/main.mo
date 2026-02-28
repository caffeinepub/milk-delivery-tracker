import Array "mo:core/Array";
import List "mo:core/List";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  public type Household = {
    id : Nat;
    name : Text;
    address : Text;
    contactPhone : Text;
  };

  public type MilkType = {
    id : Nat;
    name : Text;
  };

  public type DeliveryStatus = {
    #delivered;
    #holiday;
    #skipped;
  };

  public type DeliveryEntry = {
    id : Nat;
    householdId : Nat;
    milkTypeId : Nat;
    date : Text;
    quantityLiters : Float;
    status : DeliveryStatus;
  };

  public type HolidayDate = {
    date : Text;
    note : Text;
  };

  public type MonthlySummary = {
    month : Text;
    householdSummaries : [(Nat, Float)];
    milkTypeSummaries : [(Nat, Float)];
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let households = Map.empty<Nat, Household>();
  let milkTypes = Map.empty<Nat, MilkType>();
  let deliveryEntries = Map.empty<Nat, DeliveryEntry>();
  let holidayDates = Map.empty<Text, HolidayDate>();

  var nextHouseholdId = 1;
  var nextMilkTypeId = 1;
  var nextDeliveryEntryId = 1;

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Household CRUD
  public shared ({ caller }) func createHousehold(name : Text, address : Text, contactPhone : Text) : async Household {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create households");
    };

    let id = nextHouseholdId;
    nextHouseholdId += 1;

    let household : Household = {
      id;
      name;
      address;
      contactPhone;
    };

    households.add(id, household);
    household;
  };

  public query ({ caller }) func getAllHouseholds() : async [Household] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view households");
    };
    households.values().toArray();
  };

  public query ({ caller }) func getHousehold(id : Nat) : async ?Household {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view households");
    };
    households.get(id);
  };

  public shared ({ caller }) func updateHousehold(id : Nat, name : Text, address : Text, contactPhone : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update households");
    };
    switch (households.get(id)) {
      case (null) { Runtime.trap("Household not found") };
      case (?_) {
        let updatedHousehold : Household = {
          id;
          name;
          address;
          contactPhone;
        };
        households.add(id, updatedHousehold);
      };
    };
  };

  public shared ({ caller }) func deleteHousehold(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete households");
    };
    switch (households.get(id)) {
      case (null) { Runtime.trap("Household not found") };
      case (?_) {
        households.remove(id);
      };
    };
  };

  // MilkType CRUD
  public shared ({ caller }) func createMilkType(name : Text) : async MilkType {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create milk types");
    };

    let id = nextMilkTypeId;
    nextMilkTypeId += 1;

    let milkType : MilkType = {
      id;
      name;
    };

    milkTypes.add(id, milkType);
    milkType;
  };

  public query ({ caller }) func getAllMilkTypes() : async [MilkType] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view milk types");
    };
    milkTypes.values().toArray();
  };

  public query ({ caller }) func getMilkType(id : Nat) : async ?MilkType {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view milk types");
    };
    milkTypes.get(id);
  };

  public shared ({ caller }) func updateMilkType(id : Nat, name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update milk types");
    };
    switch (milkTypes.get(id)) {
      case (null) { Runtime.trap("Milk type not found") };
      case (?_) {
        let updatedMilkType : MilkType = {
          id;
          name;
        };
        milkTypes.add(id, updatedMilkType);
      };
    };
  };

  public shared ({ caller }) func deleteMilkType(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete milk types");
    };
    switch (milkTypes.get(id)) {
      case (null) { Runtime.trap("Milk type not found") };
      case (?_) {
        milkTypes.remove(id);
      };
    };
  };

  // DeliveryEntry CRUD
  public shared ({ caller }) func addDeliveryEntry(householdId : Nat, milkTypeId : Nat, date : Text, quantityLiters : Float, status : DeliveryStatus) : async DeliveryEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add delivery entries");
    };

    let id = nextDeliveryEntryId;
    nextDeliveryEntryId += 1;

    let entry : DeliveryEntry = {
      id;
      householdId;
      milkTypeId;
      date;
      quantityLiters;
      status;
    };

    deliveryEntries.add(id, entry);
    entry;
  };

  public shared ({ caller }) func updateDeliveryEntry(id : Nat, householdId : Nat, milkTypeId : Nat, date : Text, quantityLiters : Float, status : DeliveryStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update delivery entries");
    };
    switch (deliveryEntries.get(id)) {
      case (null) { Runtime.trap("Delivery entry not found") };
      case (?_) {
        let updatedEntry : DeliveryEntry = {
          id;
          householdId;
          milkTypeId;
          date;
          quantityLiters;
          status;
        };
        deliveryEntries.add(id, updatedEntry);
      };
    };
  };

  public shared ({ caller }) func deleteDeliveryEntry(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete delivery entries");
    };
    switch (deliveryEntries.get(id)) {
      case (null) { Runtime.trap("Delivery entry not found") };
      case (?_) {
        deliveryEntries.remove(id);
      };
    };
  };

  public query ({ caller }) func getDeliveryEntriesForMonth(month : Text) : async [DeliveryEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view delivery entries");
    };
    let entries = deliveryEntries.values().toArray();
    entries.filter<DeliveryEntry>(func(entry) {
      entry.date.startsWith(#text month);
    });
  };

  public query ({ caller }) func getDeliveryEntriesForHousehold(householdId : Nat) : async [DeliveryEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view delivery entries");
    };
    let entries = deliveryEntries.values().toArray();
    entries.filter<DeliveryEntry>(func(entry) {
      entry.householdId == householdId;
    });
  };

  public query ({ caller }) func getMonthlySummary(month : Text) : async MonthlySummary {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view monthly summaries");
    };

    let entries = deliveryEntries.values().toArray();
    let monthEntries = entries.filter(func(entry) {
      entry.date.startsWith(#text month);
    });

    let householdMap = Map.empty<Nat, Float>();
    let milkTypeMap = Map.empty<Nat, Float>();

    for (entry in monthEntries.vals()) {
      let currentHouseholdTotal = switch (householdMap.get(entry.householdId)) {
        case (null) { 0.0 };
        case (?total) { total };
      };
      householdMap.add(entry.householdId, currentHouseholdTotal + entry.quantityLiters);

      let currentMilkTypeTotal = switch (milkTypeMap.get(entry.milkTypeId)) {
        case (null) { 0.0 };
        case (?total) { total };
      };
      milkTypeMap.add(entry.milkTypeId, currentMilkTypeTotal + entry.quantityLiters);
    };

    {
      month;
      householdSummaries = householdMap.entries().toArray();
      milkTypeSummaries = milkTypeMap.entries().toArray();
    };
  };

  // Holiday management
  public shared ({ caller }) func markHoliday(date : Text, note : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can mark holidays");
    };
    let holiday : HolidayDate = {
      date;
      note;
    };
    holidayDates.add(date, holiday);
  };

  public shared ({ caller }) func unmarkHoliday(date : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can unmark holidays");
    };
    switch (holidayDates.get(date)) {
      case (null) { Runtime.trap("Date is not marked as holiday") };
      case (?_) {
        holidayDates.remove(date);
      };
    };
  };

  public query ({ caller }) func getAllHolidays() : async [HolidayDate] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view holidays");
    };
    holidayDates.values().toArray();
  };

  // Initialization with seed data
  private func seedData() {
    // Seed households
    let h1 : Household = {
      id = 1;
      name = "Smith Family";
      address = "123 Main St";
      contactPhone = "555-0101";
    };
    let h2 : Household = {
      id = 2;
      name = "Johnson Family";
      address = "456 Oak Ave";
      contactPhone = "555-0102";
    };
    let h3 : Household = {
      id = 3;
      name = "Williams Family";
      address = "789 Pine Rd";
      contactPhone = "555-0103";
    };
    households.add(1, h1);
    households.add(2, h2);
    households.add(3, h3);
    nextHouseholdId := 4;

    // Seed milk types
    let m1 : MilkType = {
      id = 1;
      name = "Full Cream";
    };
    let m2 : MilkType = {
      id = 2;
      name = "Skim";
    };
    let m3 : MilkType = {
      id = 3;
      name = "Toned";
    };
    milkTypes.add(1, m1);
    milkTypes.add(2, m2);
    milkTypes.add(3, m3);
    nextMilkTypeId := 4;

    // Seed delivery entries for current month (using 2024-01 as example)
    let entries : [DeliveryEntry] = [
      { id = 1; householdId = 1; milkTypeId = 1; date = "2024-01-01"; quantityLiters = 2.0; status = #delivered },
      { id = 2; householdId = 2; milkTypeId = 2; date = "2024-01-01"; quantityLiters = 1.5; status = #delivered },
      { id = 3; householdId = 3; milkTypeId = 3; date = "2024-01-01"; quantityLiters = 1.0; status = #delivered },
      { id = 4; householdId = 1; milkTypeId = 1; date = "2024-01-02"; quantityLiters = 2.0; status = #delivered },
      { id = 5; householdId = 2; milkTypeId = 2; date = "2024-01-02"; quantityLiters = 1.5; status = #delivered },
    ];
    
    for (entry in entries.vals()) {
      deliveryEntries.add(entry.id, entry);
    };
    nextDeliveryEntryId := 6;
  };

  seedData();
};
