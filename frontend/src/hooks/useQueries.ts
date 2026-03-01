import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { ExternalBlob } from '../backend';
import type {
  ManuscriptEntry,
  Person,
  PersonId,
  Relationship,
  Post,
  Reply,
  Activity,
  ActivityImage,
  ClanContact,
  HelpRequest,
  DonationChannel,
} from '../backend';

// ─── Manuscripts ────────────────────────────────────────────────────────────

export function useListManuscripts() {
  const { actor, isFetching } = useActor();
  return useQuery<ManuscriptEntry[]>({
    queryKey: ['manuscripts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listManuscripts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUploadManuscript() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      fileName,
      description,
      blob,
    }: {
      id: string;
      fileName: string;
      description: string;
      blob: ExternalBlob;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.uploadManuscript(id, fileName, description, blob);
      if (result.__kind__ === 'err') throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manuscripts'] });
    },
  });
}

export function useDeleteManuscript() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteManuscript(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manuscripts'] });
    },
  });
}

// ─── Family History ──────────────────────────────────────────────────────────

export function useGetFamilyHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<string>({
    queryKey: ['familyHistory'],
    queryFn: async () => {
      if (!actor) return '';
      return actor.getFamilyHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateFamilyHistory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateFamilyHistory(content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyHistory'] });
    },
  });
}

// ─── People ──────────────────────────────────────────────────────────────────

export function useListPeople() {
  const { actor, isFetching } = useActor();
  return useQuery<Person[]>({
    queryKey: ['persons'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPeople();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPerson(id: PersonId) {
  const { actor, isFetching } = useActor();
  return useQuery<Person>({
    queryKey: ['person', id.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPerson(id);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreatePerson() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      fullName: string;
      generationNumber: bigint;
      father: string;
      mother: string;
      bio: string;
      photo: ExternalBlob | null;
      gender: string | null;
      birthDate: string | null;
      deathDate: string | null;
      country: string | null;
      province: string | null;
      city: string | null;
      nationality: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.createPerson(
        params.fullName,
        params.generationNumber,
        params.father,
        params.mother,
        params.bio,
        params.photo,
        params.gender,
        params.birthDate,
        params.deathDate,
        params.country,
        params.province,
        params.city,
        params.nationality,
      );
      // createPerson always returns #ok
      return result.ok as PersonId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] });
    },
  });
}

export function useUpdatePerson() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: PersonId;
      fullName: string;
      generationNumber: bigint;
      father: string;
      mother: string;
      bio: string;
      photo: ExternalBlob | null;
      gender: string | null;
      birthDate: string | null;
      deathDate: string | null;
      country: string | null;
      province: string | null;
      city: string | null;
      nationality: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updatePerson(
        params.id,
        params.fullName,
        params.generationNumber,
        params.father,
        params.mother,
        params.bio,
        params.photo,
        params.gender,
        params.birthDate,
        params.deathDate,
        params.country,
        params.province,
        params.city,
        params.nationality,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['persons'] });
      queryClient.invalidateQueries({ queryKey: ['person', variables.id.toString()] });
    },
  });
}

export function useDeletePerson() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: PersonId) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deletePerson(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] });
    },
  });
}

export function useAddPersonMedia() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ personId, file }: { personId: PersonId; file: ExternalBlob }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.addMediaFile(personId, file);
      if (result.__kind__ === 'err') throw new Error(result.err);
      return result.ok;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['persons'] });
      queryClient.invalidateQueries({ queryKey: ['person', variables.personId.toString()] });
    },
  });
}

// ─── Relationships ───────────────────────────────────────────────────────────

export function useGetRelationships(personId: PersonId) {
  const { actor, isFetching } = useActor();
  return useQuery<Relationship[]>({
    queryKey: ['relationships', personId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRelationships(personId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddRelationship() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      person1Id,
      person2Id,
      relationshipType,
    }: {
      person1Id: PersonId;
      person2Id: PersonId;
      relationshipType: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addRelationship(person1Id, person2Id, relationshipType);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['relationships', variables.person1Id.toString()] });
      queryClient.invalidateQueries({ queryKey: ['relationships', variables.person2Id.toString()] });
      queryClient.invalidateQueries({ queryKey: ['persons'] });
    },
  });
}

export function useDeleteRelationship() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, personId }: { id: bigint; personId: PersonId }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteRelationship(id);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['relationships', variables.personId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['persons'] });
    },
  });
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export function useListPosts() {
  const { actor, isFetching } = useActor();
  return useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ authorName, content }: { authorName: string; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.createPost(authorName, content);
      if (result.__kind__ === 'err') throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useDeletePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.deletePost(id);
      if (result.__kind__ === 'err') throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['replies'] });
    },
  });
}

// ─── Replies ─────────────────────────────────────────────────────────────────

export function useListReplies(postId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<Reply[]>({
    queryKey: ['replies', postId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listReplies(postId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddReply() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      authorName,
      content,
    }: {
      postId: bigint;
      authorName: string;
      content: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.addReply(postId, authorName, content);
      if (result.__kind__ === 'err') throw new Error(result.err);
      return result.ok;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['replies', variables.postId.toString()] });
    },
  });
}

export function useDeleteReply() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, postId }: { id: bigint; postId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.deleteReply(id);
      if (result.__kind__ === 'err') throw new Error(result.err);
      return result.ok;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['replies', variables.postId.toString()] });
    },
  });
}

// ─── Activities ──────────────────────────────────────────────────────────────

export function useListActivities() {
  const { actor, isFetching } = useActor();
  return useQuery<Activity[]>({
    queryKey: ['activities'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listActivities();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetActivity(id: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<Activity>({
    queryKey: ['activity', id.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.getActivity(id);
      if (result.__kind__ === 'err') throw new Error(result.err);
      return result.ok;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateActivity() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      eventDate,
      description,
    }: {
      title: string;
      eventDate: string;
      description: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.createActivity(title, eventDate, description);
      if (result.__kind__ === 'err') throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useUpdateActivity() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      title,
      eventDate,
      description,
    }: {
      id: bigint;
      title: string;
      eventDate: string;
      description: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.updateActivity(id, title, eventDate, description);
      if (result.__kind__ === 'err') throw new Error(result.err);
      return result.ok;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['activity', variables.id.toString()] });
    },
  });
}

export function useDeleteActivity() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.deleteActivity(id);
      if (result.__kind__ === 'err') throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useListActivityImages(activityId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<ActivityImage[]>({
    queryKey: ['activityImages', activityId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listActivityImages(activityId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUploadActivityImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      activityId,
      fileName,
      mimeType,
      data,
    }: {
      activityId: bigint;
      fileName: string;
      mimeType: string;
      data: Uint8Array;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.uploadActivityImage(activityId, fileName, mimeType, data);
      if (result.__kind__ === 'err') throw new Error(result.err);
      return result.ok;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activityImages', variables.activityId.toString()] });
    },
  });
}

export function useDeleteActivityImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ imageId, activityId }: { imageId: bigint; activityId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.deleteActivityImage(imageId);
      if (result.__kind__ === 'err') throw new Error(result.err);
      return result.ok;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activityImages', variables.activityId.toString()] });
    },
  });
}

// ─── Clan Contacts ───────────────────────────────────────────────────────────

export function useListClanContacts() {
  const { actor, isFetching } = useActor();
  return useQuery<ClanContact[]>({
    queryKey: ['clanContacts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listClanContacts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateClanContact() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      contactType: string;
      name: string;
      role: string;
      phone: string | null;
      email: string | null;
      wechat: string | null;
      address: string | null;
      notes: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.createClanContact(
        params.contactType,
        params.name,
        params.role,
        params.phone,
        params.email,
        params.wechat,
        params.address,
        params.notes,
      );
      if (result.__kind__ === 'err') throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clanContacts'] });
    },
  });
}

export function useUpdateClanContact() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      contactType: string;
      name: string;
      role: string;
      phone: string | null;
      email: string | null;
      wechat: string | null;
      address: string | null;
      notes: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.updateClanContact(
        params.id,
        params.contactType,
        params.name,
        params.role,
        params.phone,
        params.email,
        params.wechat,
        params.address,
        params.notes,
      );
      if (result.__kind__ === 'err') throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clanContacts'] });
    },
  });
}

export function useDeleteClanContact() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.deleteClanContact(id);
      if (result.__kind__ === 'err') throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clanContacts'] });
    },
  });
}

// ─── Help Requests ───────────────────────────────────────────────────────────

export interface HelpRequestWithNote extends HelpRequest {
  adminNote?: string;
}

export function useListHelpRequests() {
  const { actor, isFetching } = useActor();
  return useQuery<HelpRequest[]>({
    queryKey: ['helpRequests'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.listHelpRequests();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitHelpRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      applicantName: string;
      contactInfo: string;
      requestType: string;
      description: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.submitHelpRequest(
        params.applicantName,
        params.contactInfo,
        params.requestType,
        params.description,
      );
      if (result.__kind__ === 'err') throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpRequests'] });
    },
  });
}

export function useUpdateHelpRequestStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: bigint; status: string }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.updateHelpRequestStatus(id, status);
      if (result.__kind__ === 'err') throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpRequests'] });
    },
  });
}

export function useDeleteHelpRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.deleteHelpRequest(id);
      if (result.__kind__ === 'err') throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpRequests'] });
    },
  });
}

// Admin notes stored client-side in localStorage (backend HelpRequest type doesn't have adminNote field)
const ADMIN_NOTES_KEY = 'helpRequestAdminNotes';

function getAdminNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(ADMIN_NOTES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setAdminNote(requestId: string, note: string) {
  const notes = getAdminNotes();
  notes[requestId] = note;
  localStorage.setItem(ADMIN_NOTES_KEY, JSON.stringify(notes));
}

export function useGetAdminNotes() {
  return useQuery<Record<string, string>>({
    queryKey: ['adminNotes'],
    queryFn: () => getAdminNotes(),
    staleTime: 0,
  });
}

export function useAddHelpRequestNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, note }: { requestId: bigint; note: string }) => {
      setAdminNote(requestId.toString(), note);
      return note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotes'] });
      queryClient.invalidateQueries({ queryKey: ['helpRequests'] });
    },
  });
}

// ─── Donation Channels ───────────────────────────────────────────────────────

export function useListDonationChannels() {
  const { actor, isFetching } = useActor();
  return useQuery<DonationChannel[]>({
    queryKey: ['donationChannels'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listDonationChannels();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateDonationChannel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      channelName: string;
      accountName: string | null;
      accountNumber: string | null;
      bankName: string | null;
      wechatPayQr: string | null;
      alipayQr: string | null;
      instructions: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.createDonationChannel(
        params.channelName,
        params.accountName,
        params.accountNumber,
        params.bankName,
        params.wechatPayQr,
        params.alipayQr,
        params.instructions,
      );
      if (result.__kind__ === 'err') throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donationChannels'] });
    },
  });
}

export function useUpdateDonationChannel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      channelName: string;
      accountName: string | null;
      accountNumber: string | null;
      bankName: string | null;
      wechatPayQr: string | null;
      alipayQr: string | null;
      instructions: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.updateDonationChannel(
        params.id,
        params.channelName,
        params.accountName,
        params.accountNumber,
        params.bankName,
        params.wechatPayQr,
        params.alipayQr,
        params.instructions,
      );
      if (result.__kind__ === 'err') throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donationChannels'] });
    },
  });
}

export function useDeleteDonationChannel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.deleteDonationChannel(id);
      if (result.__kind__ === 'err') throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donationChannels'] });
    },
  });
}
