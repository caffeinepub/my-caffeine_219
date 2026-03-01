import Array "mo:core/Array";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";

actor {
  include MixinStorage();

  // Access control state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User profile
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
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

  type PersonId = Nat;
  var nextPersonId = 0;
  var nextRelationshipId = 1;

  type ManuscriptEntry = {
    id : Text;
    fileName : Text;
    uploadDate : Time.Time;
    description : Text;
    blob : Storage.ExternalBlob;
  };

  let manuscripts = Map.empty<Text, ManuscriptEntry>();
  var familyHistory : Text = "";

  type Person = {
    id : PersonId;
    fullName : Text;
    generationNumber : Nat;
    father : Text;
    mother : Text;
    siblings : [PersonId];
    children : [PersonId];
    biography : Text;
    profilePhoto : ?Storage.ExternalBlob;
    mediaFiles : [Storage.ExternalBlob];
    gender : ?Text;
    birthDate : ?Text;
    deathDate : ?Text;
    country : ?Text;
    province : ?Text;
    city : ?Text;
    nationality : ?Text;
  };

  let people = Map.empty<PersonId, Person>();

  type RelationshipType = {
    name : Text;
    inverse : Text;
  };

  type Relationship = {
    id : Nat;
    person1Id : PersonId;
    person2Id : PersonId;
    relationshipType : Text;
    createdAt : Time.Time;
  };

  let relationshipTypes = Map.fromIter<Text, RelationshipType>(
    [
      ("Father", { name = "Father"; inverse = "Child" }),
      ("Mother", { name = "Mother"; inverse = "Child" }),
      ("Child", { name = "Child"; inverse = "Parent" }),
      ("Husband", { name = "Husband"; inverse = "Wife" }),
      ("Wife", { name = "Wife"; inverse = "Husband" }),
      ("Brother", { name = "Brother"; inverse = "Brother" }),
      ("Sister", { name = "Sister"; inverse = "Sister" }),
    ].values(),
  );

  let relationships = Map.empty<Nat, Relationship>();

  public shared ({ caller }) func uploadManuscript(
    id : Text,
    fileName : Text,
    description : Text,
    blob : Storage.ExternalBlob,
  ) : async { #ok : (); #err : Text } {
    let entry : ManuscriptEntry = {
      id;
      fileName;
      uploadDate = Time.now();
      description;
      blob;
    };
    manuscripts.add(id, entry);
    #ok ();
  };

  public query func listManuscripts() : async [ManuscriptEntry] {
    manuscripts.values().toArray();
  };

  public query func getManuscript(id : Text) : async ManuscriptEntry {
    switch (manuscripts.get(id)) {
      case (null) { Runtime.trap("Manuscript not found") };
      case (?entry) { entry };
    };
  };

  public shared ({ caller }) func deleteManuscript(id : Text) : async () {
    if (not manuscripts.containsKey(id)) {
      Runtime.trap("Manuscript not found");
    };
    manuscripts.remove(id);
  };

  public query func getFamilyHistory() : async Text {
    familyHistory;
  };

  public shared ({ caller }) func updateFamilyHistory(content : Text) : async () {
    familyHistory := content;
  };

  public shared ({ caller }) func createPerson(
    fullName : Text,
    generationNumber : Nat,
    father : Text,
    mother : Text,
    bio : Text,
    photo : ?Storage.ExternalBlob,
    gender : ?Text,
    birthDate : ?Text,
    deathDate : ?Text,
    country : ?Text,
    province : ?Text,
    city : ?Text,
    nationality : ?Text,
  ) : async { #ok : PersonId } {
    let personId = nextPersonId;
    nextPersonId += 1;

    let person : Person = {
      id = personId;
      fullName;
      generationNumber;
      father;
      mother;
      siblings = [];
      children = [];
      biography = bio;
      profilePhoto = photo;
      mediaFiles = [];
      gender;
      birthDate;
      deathDate;
      country;
      province;
      city;
      nationality;
    };
    people.add(personId, person);
    #ok personId;
  };

  public query func getPerson(id : PersonId) : async Person {
    switch (people.get(id)) {
      case (null) { Runtime.trap("Person not found") };
      case (?person) { person };
    };
  };

  public query func listPeople() : async [Person] {
    people.values().toArray();
  };

  public shared ({ caller }) func updatePerson(
    id : PersonId,
    fullName : Text,
    generationNumber : Nat,
    father : Text,
    mother : Text,
    bio : Text,
    photo : ?Storage.ExternalBlob,
    gender : ?Text,
    birthDate : ?Text,
    deathDate : ?Text,
    country : ?Text,
    province : ?Text,
    city : ?Text,
    nationality : ?Text,
  ) : async () {
    switch (people.get(id)) {
      case (null) { Runtime.trap("Person not found") };
      case (?existing) {
        let updated : Person = {
          id;
          fullName;
          generationNumber;
          father;
          mother;
          siblings = existing.siblings;
          children = existing.children;
          biography = bio;
          profilePhoto = photo;
          mediaFiles = existing.mediaFiles;
          gender;
          birthDate;
          deathDate;
          country;
          province;
          city;
          nationality;
        };
        people.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deletePerson(id : PersonId) : async () {
    if (not people.containsKey(id)) {
      Runtime.trap("Person not found");
    };
    people.remove(id);
  };

  public shared ({ caller }) func addMediaFile(personId : PersonId, file : Storage.ExternalBlob) : async { #ok : (); #err : Text } {
    switch (people.get(personId)) {
      case (null) { #err("Person not found") };
      case (?person) {
        let updated : Person = {
          id = person.id;
          fullName = person.fullName;
          generationNumber = person.generationNumber;
          father = person.father;
          mother = person.mother;
          siblings = person.siblings;
          children = person.children;
          biography = person.biography;
          profilePhoto = person.profilePhoto;
          mediaFiles = person.mediaFiles.concat([file]);
          gender = person.gender;
          birthDate = person.birthDate;
          deathDate = person.deathDate;
          country = person.country;
          province = person.province;
          city = person.city;
          nationality = person.nationality;
        };
        people.add(personId, updated);
        #ok ();
      };
    };
  };

  public shared ({ caller }) func addRelationship(person1Id : PersonId, person2Id : PersonId, relationshipType : Text) : async () {
    if (not people.containsKey(person1Id) or not people.containsKey(person2Id)) {
      Runtime.trap("One or both person IDs not found");
    };

    let relType = switch (relationshipTypes.get(relationshipType)) {
      case (null) { Runtime.trap("Invalid relationship type") };
      case (?t) { t };
    };

    let relationshipId = nextRelationshipId;
    nextRelationshipId += 1;

    let forwardRelationship : Relationship = {
      id = relationshipId;
      person1Id;
      person2Id;
      relationshipType;
      createdAt = Time.now();
    };

    let reversedRelationship : Relationship = {
      id = nextRelationshipId;
      person1Id = person2Id;
      person2Id = person1Id;
      relationshipType = relType.inverse;
      createdAt = Time.now();
    };

    relationships.add(forwardRelationship.id, forwardRelationship);
    relationships.add(reversedRelationship.id, reversedRelationship);
    nextRelationshipId += 1;
  };

  public query func getRelationships(personId : PersonId) : async [Relationship] {
    relationships.values().toArray().filter(
      func(r) { r.person1Id == personId }
    );
  };

  public shared ({ caller }) func deleteRelationship(id : Nat) : async () {
    if (not relationships.containsKey(id)) {
      Runtime.trap("Relationship not found");
    };

    let forward = switch (relationships.get(id)) {
      case (null) { Runtime.trap("Relationship not found") };
      case (?r) { r };
    };

    let forwardType = switch (relationshipTypes.get(forward.relationshipType)) {
      case (null) { Runtime.trap("Relationship type not found") };
      case (?t) { t };
    };

    let reversed = relationships.values().toArray().find(
      func(r : Relationship) : Bool {
        r.person1Id == forward.person2Id and
        r.person2Id == forward.person1Id and
        r.relationshipType == forwardType.inverse
      }
    );

    switch (reversed) {
      case (null) {
        relationships.remove(id);
      };
      case (?r) {
        relationships.remove(id);
        relationships.remove(r.id);
      };
    };
  };

  // Message Board (Clans)

  public type Post = {
    id : Nat;
    authorName : Text;
    content : Text;
    createdAt : Int;
  };

  public type Reply = {
    id : Nat;
    postId : Nat;
    authorName : Text;
    content : Text;
    createdAt : Int;
  };

  var nextPostId = 0;
  var nextReplyId = 0;

  let posts = Map.empty<Nat, Post>();
  let replies = Map.empty<Nat, Reply>();

  // No authorization check: any caller (including guests) can create posts
  public shared ({ caller }) func createPost(authorName : Text, content : Text) : async { #ok : Post; #err : Text } {
    if (content.size() == 0) { return #err("Post content cannot be empty") };
    if (authorName.size() == 0) { return #err("Author name cannot be empty") };

    let post : Post = {
      id = nextPostId;
      authorName;
      content;
      createdAt = Time.now();
    };
    posts.add(nextPostId, post);
    nextPostId += 1;
    #ok(post);
  };

  public query func listPosts() : async [Post] {
    posts.values().toArray().sort(
      func(a, b) {
        Int.compare(b.createdAt, a.createdAt);
      }
    );
  };

  // No authorization check: any caller (including guests) can add replies
  public shared ({ caller }) func addReply(postId : Nat, authorName : Text, content : Text) : async { #ok : Reply; #err : Text } {
    switch (posts.get(postId)) {
      case (null) { return #err("Post not found") };
      case (_) {
        if (content.size() == 0) { return #err("Reply content cannot be empty") };
        if (authorName.size() == 0) { return #err("Author name cannot be empty") };

        let reply : Reply = {
          id = nextReplyId;
          postId;
          authorName;
          content;
          createdAt = Time.now();
        };
        replies.add(nextReplyId, reply);
        nextReplyId += 1;
        #ok(reply);
      };
    };
  };

  public query func listReplies(postId : Nat) : async [Reply] {
    replies.values().toArray().filter(
      func(reply) { reply.postId == postId }
    ).sort(
      func(a, b) {
        Int.compare(a.createdAt, b.createdAt);
      }
    );
  };

  // Admin-only: delete posts
  public shared ({ caller }) func deletePost(id : Nat) : async { #ok : (); #err : Text } {
    if (not posts.containsKey(id)) { return #err("Post not found") };

    // Remove replies associated with the post
    replies.forEach(
      func(replyId, reply) {
        if (reply.postId == id) {
          replies.remove(replyId);
        };
      }
    );

    posts.remove(id);
    #ok(());
  };

  // Admin-only: delete replies
  public shared ({ caller }) func deleteReply(id : Nat) : async { #ok : (); #err : Text } {
    switch (replies.get(id)) {
      case (null) { #err("Reply not found") };
      case (_) {
        replies.remove(id);
        #ok(());
      };
    };
  };

  // Family Activities

  public type Activity = {
    id : Nat;
    title : Text;
    eventDate : Text;
    description : Text;
    createdAt : Int;
  };

  public type ActivityImage = {
    id : Nat;
    activityId : Nat;
    fileName : Text;
    mimeType : Text;
    data : Blob;
    uploadedAt : Int;
  };

  let activities = Map.empty<Nat, Activity>();
  let activityImages = Map.empty<Nat, ActivityImage>();
  var nextActivityId = 0;
  var nextActivityImageId = 0;

  public shared ({ caller }) func createActivity(title : Text, eventDate : Text, description : Text) : async { #ok : Activity; #err : Text } {
    if (title.size() == 0) { return #err("Title cannot be empty") };
    if (eventDate.size() == 0) { return #err("Event date cannot be empty") };

    let activity : Activity = {
      id = nextActivityId;
      title;
      eventDate;
      description;
      createdAt = Time.now();
    };
    activities.add(nextActivityId, activity);
    nextActivityId += 1;
    #ok(activity);
  };

  public query func listActivities() : async [Activity] {
    activities.values().toArray();
  };

  public query func getActivity(id : Nat) : async { #ok : Activity; #err : Text } {
    switch (activities.get(id)) {
      case (null) { #err("Activity not found") };
      case (?activity) { #ok(activity) };
    };
  };

  public shared ({ caller }) func updateActivity(id : Nat, title : Text, eventDate : Text, description : Text) : async { #ok : Activity; #err : Text } {
    switch (activities.get(id)) {
      case (null) { #err("Activity not found") };
      case (?existing) {
        let updated : Activity = {
          id = existing.id;
          title;
          eventDate;
          description;
          createdAt = existing.createdAt;
        };
        activities.add(id, updated);
        #ok(updated);
      };
    };
  };

  public shared ({ caller }) func deleteActivity(id : Nat) : async { #ok : (); #err : Text } {
    switch (activities.get(id)) {
      case (null) { #err("Activity not found") };
      case (_) {
        // Remove images associated with the activity
        activityImages.forEach(
          func(imageId, image) {
            if (image.activityId == id) {
              activityImages.remove(imageId);
            };
          }
        );
        activities.remove(id);
        #ok(());
      };
    };
  };

  public shared ({ caller }) func uploadActivityImage(activityId : Nat, fileName : Text, mimeType : Text, data : Blob) : async { #ok : ActivityImage; #err : Text } {
    switch (activities.get(activityId)) {
      case (null) { return #err("Activity not found") };
      case (_) {
        let image : ActivityImage = {
          id = nextActivityImageId;
          activityId;
          fileName;
          mimeType;
          data;
          uploadedAt = Time.now();
        };
        activityImages.add(nextActivityImageId, image);
        nextActivityImageId += 1;
        #ok(image);
      };
    };
  };

  public query func listActivityImages(activityId : Nat) : async [ActivityImage] {
    activityImages.values().toArray().filter(
      func(image) { image.activityId == activityId }
    );
  };

  public shared ({ caller }) func deleteActivityImage(imageId : Nat) : async { #ok : (); #err : Text } {
    switch (activityImages.get(imageId)) {
      case (null) { #err("Activity image not found") };
      case (_) {
        activityImages.remove(imageId);
        #ok(());
      };
    };
  };

  // -------------------- CLAN CONTACT SECTION --------------------

  public type ClanContact = {
    id : Nat;
    contactType : Text;
    name : Text;
    role : Text;
    phone : ?Text;
    email : ?Text;
    wechat : ?Text;
    address : ?Text;
    notes : ?Text;
    createdAt : Int;
  };

  public type HelpRequest = {
    id : Nat;
    applicantName : Text;
    contactInfo : Text;
    requestType : Text;
    description : Text;
    status : Text;
    createdAt : Int;
  };

  public type DonationChannel = {
    id : Nat;
    channelName : Text;
    accountName : ?Text;
    accountNumber : ?Text;
    bankName : ?Text;
    wechatPayQr : ?Text;
    alipayQr : ?Text;
    instructions : ?Text;
    createdAt : Int;
  };

  let clanContacts = Map.empty<Nat, ClanContact>();
  let helpRequests = Map.empty<Nat, HelpRequest>();
  let donationChannels = Map.empty<Nat, DonationChannel>();

  var nextClanContactId = 0;
  var nextHelpRequestId = 0;
  var nextDonationChannelId = 0;

  // Clan Contact APIs - No authorization
  public shared ({ caller }) func createClanContact(
    contactType : Text,
    name : Text,
    role : Text,
    phone : ?Text,
    email : ?Text,
    wechat : ?Text,
    address : ?Text,
    notes : ?Text,
  ) : async { #ok : ClanContact; #err : Text } {
    if (name.size() == 0) { return #err("Contact name cannot be empty") };
    if (contactType.size() == 0) {
      return #err("Contact type cannot be empty");
    };

    let contact : ClanContact = {
      id = nextClanContactId;
      contactType;
      name;
      role;
      phone;
      email;
      wechat;
      address;
      notes;
      createdAt = Time.now();
    };
    clanContacts.add(nextClanContactId, contact);
    nextClanContactId += 1;
    #ok(contact);
  };

  // Clan Contact APIs - Everyone can call
  public shared ({ caller }) func updateClanContact(
    id : Nat,
    contactType : Text,
    name : Text,
    role : Text,
    phone : ?Text,
    email : ?Text,
    wechat : ?Text,
    address : ?Text,
    notes : ?Text,
  ) : async { #ok : ClanContact; #err : Text } {
    switch (clanContacts.get(id)) {
      case (null) { #err("Contact not found") };
      case (?existing) {
        let updated : ClanContact = {
          id = existing.id;
          contactType;
          name;
          role;
          phone;
          email;
          wechat;
          address;
          notes;
          createdAt = existing.createdAt;
        };
        clanContacts.add(id, updated);
        #ok(updated);
      };
    };
  };

  // Clan Contact APIs - Everyone can call
  public shared ({ caller }) func deleteClanContact(id : Nat) : async { #ok : (); #err : Text } {
    if (not clanContacts.containsKey(id)) {
      return #err("Contact not found");
    };
    clanContacts.remove(id);
    #ok(());
  };

  // Read operations for clan contacts — no auth required (public info)
  public query func listClanContacts() : async [ClanContact] {
    clanContacts.values().toArray();
  };

  public query func getClanContact(id : Nat) : async { #ok : ClanContact; #err : Text } {
    switch (clanContacts.get(id)) {
      case (null) { #err("Contact not found") };
      case (?contact) { #ok(contact) };
    };
  };

  // Help Request APIs
  // submitHelpRequest — no auth required: any visitor (guest) can submit
  public shared ({ caller }) func submitHelpRequest(
    applicantName : Text,
    contactInfo : Text,
    requestType : Text,
    description : Text,
  ) : async { #ok : HelpRequest; #err : Text } {
    if (applicantName.size() == 0) { return #err("Applicant name cannot be empty") };
    if (requestType.size() == 0) { return #err("Request type cannot be empty") };

    let request : HelpRequest = {
      id = nextHelpRequestId;
      applicantName;
      contactInfo;
      requestType;
      description;
      status = "pending";
      createdAt = Time.now();
    };
    helpRequests.add(nextHelpRequestId, request);
    nextHelpRequestId += 1;
    #ok(request);
  };

  // listHelpRequests — admin only: contains personal applicant data
  public query ({ caller }) func listHelpRequests() : async [HelpRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list help requests");
    };
    let requests = helpRequests.values().toArray();
    requests.sort(
      func(a, b) {
        Int.compare(b.createdAt, a.createdAt);
      }
    );
  };

  // Help Request APIs - Everyone can call
  public shared ({ caller }) func updateHelpRequestStatus(id : Nat, status : Text) : async { #ok : (); #err : Text } {
    switch (helpRequests.get(id)) {
      case (null) { #err("Help request not found") };
      case (?existing) {
        let updated : HelpRequest = {
          id = existing.id;
          applicantName = existing.applicantName;
          contactInfo = existing.contactInfo;
          requestType = existing.requestType;
          description = existing.description;
          status;
          createdAt = existing.createdAt;
        };
        helpRequests.add(id, updated);
        #ok(());
      };
    };
  };

  // Help Request APIs - Everyone can call
  public shared ({ caller }) func deleteHelpRequest(id : Nat) : async { #ok : (); #err : Text } {
    if (not helpRequests.containsKey(id)) {
      return #err("Help request not found");
    };
    helpRequests.remove(id);
    #ok(());
  };

  // Donation Channel APIs - No authorization
  public shared ({ caller }) func createDonationChannel(
    channelName : Text,
    accountName : ?Text,
    accountNumber : ?Text,
    bankName : ?Text,
    wechatPayQr : ?Text,
    alipayQr : ?Text,
    instructions : ?Text,
  ) : async { #ok : DonationChannel; #err : Text } {
    if (channelName.size() == 0) {
      return #err("Channel name cannot be empty");
    };

    let channel : DonationChannel = {
      id = nextDonationChannelId;
      channelName;
      accountName;
      accountNumber;
      bankName;
      wechatPayQr;
      alipayQr;
      instructions;
      createdAt = Time.now();
    };
    donationChannels.add(nextDonationChannelId, channel);
    nextDonationChannelId += 1;
    #ok(channel);
  };

  // Donation Channel APIs - Everyone can call
  public shared ({ caller }) func updateDonationChannel(
    id : Nat,
    channelName : Text,
    accountName : ?Text,
    accountNumber : ?Text,
    bankName : ?Text,
    wechatPayQr : ?Text,
    alipayQr : ?Text,
    instructions : ?Text,
  ) : async { #ok : DonationChannel; #err : Text } {
    switch (donationChannels.get(id)) {
      case (null) { #err("Donation channel not found") };
      case (?existing) {
        let updated : DonationChannel = {
          id = existing.id;
          channelName;
          accountName;
          accountNumber;
          bankName;
          wechatPayQr;
          alipayQr;
          instructions;
          createdAt = existing.createdAt;
        };
        donationChannels.add(id, updated);
        #ok(updated);
      };
    };
  };

  // Donation Channel APIs - Everyone can call
  public shared ({ caller }) func deleteDonationChannel(id : Nat) : async { #ok : (); #err : Text } {
    if (not donationChannels.containsKey(id)) {
      return #err("Channel not found");
    };
    donationChannels.remove(id);
    #ok(());
  };

  // Read operations for donation channels — no auth required (public info)
  public query func listDonationChannels() : async [DonationChannel] {
    donationChannels.values().toArray();
  };

  public query func getDonationChannel(id : Nat) : async { #ok : DonationChannel; #err : Text } {
    switch (donationChannels.get(id)) {
      case (null) { #err("Channel not found") };
      case (?channel) { #ok(channel) };
    };
  };
};
