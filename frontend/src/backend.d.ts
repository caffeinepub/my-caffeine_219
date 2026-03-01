import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Reply {
    id: bigint;
    content: string;
    createdAt: bigint;
    authorName: string;
    postId: bigint;
}
export type Time = bigint;
export interface HelpRequest {
    id: bigint;
    status: string;
    applicantName: string;
    contactInfo: string;
    createdAt: bigint;
    description: string;
    requestType: string;
}
export type PersonId = bigint;
export interface DonationChannel {
    id: bigint;
    wechatPayQr?: string;
    channelName: string;
    createdAt: bigint;
    instructions?: string;
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    alipayQr?: string;
}
export interface ClanContact {
    id: bigint;
    contactType: string;
    name: string;
    createdAt: bigint;
    role: string;
    email?: string;
    address?: string;
    notes?: string;
    phone?: string;
    wechat?: string;
}
export interface ActivityImage {
    id: bigint;
    data: Uint8Array;
    activityId: bigint;
    mimeType: string;
    fileName: string;
    uploadedAt: bigint;
}
export interface Activity {
    id: bigint;
    title: string;
    createdAt: bigint;
    description: string;
    eventDate: string;
}
export interface ManuscriptEntry {
    id: string;
    blob: ExternalBlob;
    description: string;
    fileName: string;
    uploadDate: Time;
}
export interface Post {
    id: bigint;
    content: string;
    createdAt: bigint;
    authorName: string;
}
export interface Person {
    id: PersonId;
    country?: string;
    province?: string;
    deathDate?: string;
    birthDate?: string;
    city?: string;
    profilePhoto?: ExternalBlob;
    biography: string;
    generationNumber: bigint;
    fullName: string;
    siblings: Array<PersonId>;
    nationality?: string;
    children: Array<PersonId>;
    gender?: string;
    mother: string;
    mediaFiles: Array<ExternalBlob>;
    father: string;
}
export interface UserProfile {
    name: string;
}
export interface Relationship {
    id: bigint;
    createdAt: Time;
    person1Id: PersonId;
    person2Id: PersonId;
    relationshipType: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addMediaFile(personId: PersonId, file: ExternalBlob): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addRelationship(person1Id: PersonId, person2Id: PersonId, relationshipType: string): Promise<void>;
    addReply(postId: bigint, authorName: string, content: string): Promise<{
        __kind__: "ok";
        ok: Reply;
    } | {
        __kind__: "err";
        err: string;
    }>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createActivity(title: string, eventDate: string, description: string): Promise<{
        __kind__: "ok";
        ok: Activity;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createClanContact(contactType: string, name: string, role: string, phone: string | null, email: string | null, wechat: string | null, address: string | null, notes: string | null): Promise<{
        __kind__: "ok";
        ok: ClanContact;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createDonationChannel(channelName: string, accountName: string | null, accountNumber: string | null, bankName: string | null, wechatPayQr: string | null, alipayQr: string | null, instructions: string | null): Promise<{
        __kind__: "ok";
        ok: DonationChannel;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createPerson(fullName: string, generationNumber: bigint, father: string, mother: string, bio: string, photo: ExternalBlob | null, gender: string | null, birthDate: string | null, deathDate: string | null, country: string | null, province: string | null, city: string | null, nationality: string | null): Promise<{
        __kind__: "ok";
        ok: PersonId;
    }>;
    createPost(authorName: string, content: string): Promise<{
        __kind__: "ok";
        ok: Post;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteActivity(id: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteActivityImage(imageId: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteClanContact(id: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteDonationChannel(id: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteHelpRequest(id: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteManuscript(id: string): Promise<void>;
    deletePerson(id: PersonId): Promise<void>;
    deletePost(id: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteRelationship(id: bigint): Promise<void>;
    deleteReply(id: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getActivity(id: bigint): Promise<{
        __kind__: "ok";
        ok: Activity;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getClanContact(id: bigint): Promise<{
        __kind__: "ok";
        ok: ClanContact;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getDonationChannel(id: bigint): Promise<{
        __kind__: "ok";
        ok: DonationChannel;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getFamilyHistory(): Promise<string>;
    getManuscript(id: string): Promise<ManuscriptEntry>;
    getPerson(id: PersonId): Promise<Person>;
    getRelationships(personId: PersonId): Promise<Array<Relationship>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listActivities(): Promise<Array<Activity>>;
    listActivityImages(activityId: bigint): Promise<Array<ActivityImage>>;
    listClanContacts(): Promise<Array<ClanContact>>;
    listDonationChannels(): Promise<Array<DonationChannel>>;
    listHelpRequests(): Promise<Array<HelpRequest>>;
    listManuscripts(): Promise<Array<ManuscriptEntry>>;
    listPeople(): Promise<Array<Person>>;
    listPosts(): Promise<Array<Post>>;
    listReplies(postId: bigint): Promise<Array<Reply>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitHelpRequest(applicantName: string, contactInfo: string, requestType: string, description: string): Promise<{
        __kind__: "ok";
        ok: HelpRequest;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateActivity(id: bigint, title: string, eventDate: string, description: string): Promise<{
        __kind__: "ok";
        ok: Activity;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateClanContact(id: bigint, contactType: string, name: string, role: string, phone: string | null, email: string | null, wechat: string | null, address: string | null, notes: string | null): Promise<{
        __kind__: "ok";
        ok: ClanContact;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateDonationChannel(id: bigint, channelName: string, accountName: string | null, accountNumber: string | null, bankName: string | null, wechatPayQr: string | null, alipayQr: string | null, instructions: string | null): Promise<{
        __kind__: "ok";
        ok: DonationChannel;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateFamilyHistory(content: string): Promise<void>;
    updateHelpRequestStatus(id: bigint, status: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updatePerson(id: PersonId, fullName: string, generationNumber: bigint, father: string, mother: string, bio: string, photo: ExternalBlob | null, gender: string | null, birthDate: string | null, deathDate: string | null, country: string | null, province: string | null, city: string | null, nationality: string | null): Promise<void>;
    uploadActivityImage(activityId: bigint, fileName: string, mimeType: string, data: Uint8Array): Promise<{
        __kind__: "ok";
        ok: ActivityImage;
    } | {
        __kind__: "err";
        err: string;
    }>;
    uploadManuscript(id: string, fileName: string, description: string, blob: ExternalBlob): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
}
