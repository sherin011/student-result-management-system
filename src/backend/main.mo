import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Order "mo:core/Order";

persistent actor {
  type StudentResult = {
    id : Nat;
    rollNumber : Text;
    studentName : Text;
    maths : Nat;
    science : Nat;
    english : Nat;
    tamil : Nat;
    computerScience : Nat;
    total : Nat;
    average : Float;
    grade : Text;
    timestamp : Int;
  };

  module StudentResult {
    public func compare(result1 : StudentResult, result2 : StudentResult) : Order.Order {
      Nat.compare(result1.id, result2.id);
    };
  };

  let results = Map.empty<Nat, StudentResult>();
  var nextId : Nat = 0;

  public shared ({ caller }) func addResult(
    rollNumber : Text,
    studentName : Text,
    maths : Nat,
    science : Nat,
    english : Nat,
    tamil : Nat,
    computerScience : Nat,
    total : Nat,
    average : Float,
    grade : Text,
    timestamp : Int,
  ) : async Nat {
    let newResult : StudentResult = {
      id = nextId;
      rollNumber;
      studentName;
      maths;
      science;
      english;
      tamil;
      computerScience;
      total;
      average;
      grade;
      timestamp;
    };

    results.add(nextId, newResult);
    nextId += 1;
    newResult.id;
  };

  public query ({ caller }) func getResults() : async [StudentResult] {
    results.values().toArray().sort();
  };

  public shared ({ caller }) func deleteResult(id : Nat) : async () {
    if (not results.containsKey(id)) {
      Runtime.trap("Result with id does not exist");
    };
    results.remove(id);
  };

  public shared ({ caller }) func clearAll() : async () {
    results.clear();
    nextId := 0;
  };
};
