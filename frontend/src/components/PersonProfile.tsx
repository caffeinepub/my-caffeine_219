import React, { useState } from 'react';
import {
  useListPeople,
  useGetRelationships,
  useAddPersonMedia,
  useAddRelationship,
  useDeleteRelationship,
  useDeletePerson,
} from '../hooks/useQueries';
import { ExternalBlob } from '../backend';
import type { Person, PersonId } from '../backend';
import UploadPasscodeModal from './UploadPasscodeModal';
import DeletePasscodeModal from './DeletePasscodeModal';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Trash2, User, Image, Link2, Edit2 } from 'lucide-react';

const RELATIONSHIP_TYPE_OPTIONS = [
  { value: 'Father', label: '父亲' },
  { value: 'Mother', label: '母亲' },
  { value: 'Husband', label: '丈夫' },
  { value: 'Wife', label: '妻子' },
  { value: 'Brother', label: '兄弟' },
  { value: 'Sister', label: '姐妹' },
  { value: 'Child', label: '子女' },
];

const RELATIONSHIP_TYPE_LABEL: Record<string, string> = {
  Father: '父亲',
  Mother: '母亲',
  Husband: '丈夫',
  Wife: '妻子',
  Brother: '兄弟',
  Sister: '姐妹',
  Child: '子女',
  Parent: '父母',
};

interface PersonProfileProps {
  person: Person;
  onBack: () => void;
  onEdit: () => void;
}

export default function PersonProfile({ person, onBack, onEdit }: PersonProfileProps) {
  const { data: allPeople = [] } = useListPeople();
  const { data: relationships = [], refetch: refetchRelationships } = useGetRelationships(
    person.id,
  );
  const addMedia = useAddPersonMedia();
  const addRelationship = useAddRelationship();
  const deleteRelationship = useDeleteRelationship();
  const deletePerson = useDeletePerson();

  const [activeTab, setActiveTab] = useState<'bio' | 'media' | 'relationships'>('bio');

  // Media upload
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUploadOpen, setMediaUploadOpen] = useState(false);

  // Relationship add
  const [relPerson2Id, setRelPerson2Id] = useState<string>('');
  const [relType, setRelType] = useState<string>('Father');
  const [relAddOpen, setRelAddOpen] = useState(false);

  // Delete states
  const [deletePersonOpen, setDeletePersonOpen] = useState(false);
  const [deleteRelOpen, setDeleteRelOpen] = useState(false);
  const [relToDelete, setRelToDelete] = useState<bigint | null>(null);

  function handleMediaFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setMediaFile(e.target.files?.[0] ?? null);
  }

  function handleMediaUploadClick() {
    if (!mediaFile) return;
    setMediaUploadOpen(true);
  }

  async function doUploadMedia() {
    if (!mediaFile) return;
    const bytes = new Uint8Array(await mediaFile.arrayBuffer());
    const blob = ExternalBlob.fromBytes(bytes);
    await addMedia.mutateAsync({ personId: person.id, file: blob });
    setMediaFile(null);
  }

  function handleAddRelClick() {
    if (!relPerson2Id) return;
    setRelAddOpen(true);
  }

  async function doAddRelationship() {
    await addRelationship.mutateAsync({
      person1Id: person.id,
      person2Id: BigInt(relPerson2Id),
      relationshipType: relType,
    });
    setRelPerson2Id('');
    setRelType('Father');
    refetchRelationships();
  }

  function handleDeleteRelClick(relId: bigint) {
    setRelToDelete(relId);
    setDeleteRelOpen(true);
  }

  async function doDeleteRelationship() {
    if (relToDelete === null) return;
    await deleteRelationship.mutateAsync({ id: relToDelete, personId: person.id });
    setRelToDelete(null);
    refetchRelationships();
  }

  async function doDeletePerson() {
    await deletePerson.mutateAsync(person.id);
    onBack();
  }

  const otherPeople = allPeople.filter((p) => p.id !== person.id);

  function getPersonName(id: PersonId): string {
    return allPeople.find((p) => p.id === id)?.fullName ?? `#${id}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-ink/60 hover:text-ink"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回
          </Button>
          <h3 className="text-lg font-serif text-ink font-semibold">{person.fullName}</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="border-seal/40 text-seal hover:bg-seal/10"
          >
            <Edit2 className="w-4 h-4 mr-1" />
            编辑
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeletePersonOpen(true)}
            className="border-seal/40 text-seal hover:bg-seal/10"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            删除
          </Button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="flex items-center gap-4 p-4 manuscript-border rounded-xl bg-parchment-dark">
        <div className="w-16 h-16 rounded-full border-2 border-ink/20 overflow-hidden bg-parchment flex items-center justify-center shrink-0">
          {person.profilePhoto ? (
            <img
              src={person.profilePhoto.getDirectURL()}
              alt={person.fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-8 h-8 text-ink/30" />
          )}
        </div>
        <div>
          <h2 className="text-xl font-serif font-bold text-ink">{person.fullName}</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-ink/60">
            {person.generationNumber > 0n && <span>第{person.generationNumber.toString()}世</span>}
            {person.gender && <span>{person.gender === 'male' ? '男' : '女'}</span>}
            {person.birthDate && <span>生：{person.birthDate}</span>}
            {person.deathDate && <span>卒：{person.deathDate}</span>}
            {(person.country || person.province || person.city) && (
              <span>
                {[person.country, person.province, person.city].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-ink/20">
        {[
          { key: 'bio', label: '简介', icon: <User className="w-4 h-4" /> },
          { key: 'media', label: '媒体', icon: <Image className="w-4 h-4" /> },
          { key: 'relationships', label: '关系', icon: <Link2 className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-seal text-seal'
                : 'border-transparent text-ink/50 hover:text-ink'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'bio' && (
        <div className="space-y-4">
          {person.father && (
            <div>
              <span className="text-xs text-ink/50">父亲：</span>
              <span className="text-sm text-ink">{person.father}</span>
            </div>
          )}
          {person.mother && (
            <div>
              <span className="text-xs text-ink/50">母亲：</span>
              <span className="text-sm text-ink">{person.mother}</span>
            </div>
          )}
          {person.nationality && (
            <div>
              <span className="text-xs text-ink/50">民族：</span>
              <span className="text-sm text-ink">{person.nationality}</span>
            </div>
          )}
          {person.biography ? (
            <div className="manuscript-border rounded-xl p-4 bg-parchment-dark">
              <p className="font-serif text-ink text-sm leading-relaxed whitespace-pre-wrap">
                {person.biography}
              </p>
            </div>
          ) : (
            <p className="text-ink/40 text-sm italic">暂无个人简介</p>
          )}
        </div>
      )}

      {activeTab === 'media' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaFileChange}
              className="text-sm text-ink/70 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-seal/10 file:text-seal hover:file:bg-seal/20 cursor-pointer"
            />
            <Button
              size="sm"
              onClick={handleMediaUploadClick}
              disabled={!mediaFile || addMedia.isPending}
              className="bg-seal hover:bg-seal/90 text-parchment shrink-0"
            >
              <Plus className="w-4 h-4 mr-1" />
              {addMedia.isPending ? '上传中...' : '上传'}
            </Button>
          </div>
          {person.mediaFiles.length === 0 ? (
            <p className="text-ink/40 text-sm italic text-center py-8">暂无媒体文件</p>
          ) : (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
              {person.mediaFiles.map((file, idx) => (
                <div key={idx} className="rounded-lg overflow-hidden border border-ink/20">
                  <img
                    src={file.getDirectURL()}
                    alt={`媒体 ${idx + 1}`}
                    className="w-full h-32 object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'relationships' && (
        <div className="space-y-4">
          {/* Add relationship */}
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="text-xs text-ink/60 mb-1 block">选择族人</label>
              <select
                value={relPerson2Id}
                onChange={(e) => setRelPerson2Id(e.target.value)}
                className="px-3 py-2 rounded-md border border-ink/30 bg-parchment-dark text-ink text-sm focus:outline-none focus:ring-2 focus:ring-seal/30"
              >
                <option value="">-- 选择 --</option>
                {otherPeople.map((p) => (
                  <option key={p.id.toString()} value={p.id.toString()}>
                    {p.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-ink/60 mb-1 block">关系类型</label>
              <select
                value={relType}
                onChange={(e) => setRelType(e.target.value)}
                className="px-3 py-2 rounded-md border border-ink/30 bg-parchment-dark text-ink text-sm focus:outline-none focus:ring-2 focus:ring-seal/30"
              >
                {RELATIONSHIP_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <Button
              size="sm"
              onClick={handleAddRelClick}
              disabled={!relPerson2Id || addRelationship.isPending}
              className="bg-seal hover:bg-seal/90 text-parchment"
            >
              <Plus className="w-4 h-4 mr-1" />
              添加关系
            </Button>
          </div>

          {/* Relationship list */}
          {relationships.length === 0 ? (
            <p className="text-ink/40 text-sm italic text-center py-8">暂无关系记录</p>
          ) : (
            <div className="space-y-2">
              {relationships.map((rel) => (
                <div
                  key={rel.id.toString()}
                  className="flex items-center justify-between p-3 bg-parchment-dark border border-ink/20 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-seal/10 text-seal px-2 py-0.5 rounded-full">
                      {RELATIONSHIP_TYPE_LABEL[rel.relationshipType] ?? rel.relationshipType}
                    </span>
                    <span className="text-sm text-ink">{getPersonName(rel.person2Id)}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteRelClick(rel.id)}
                    className="p-1 text-ink/40 hover:text-seal transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Passcode Modals — use `open` prop (not `isOpen`) */}
      <UploadPasscodeModal
        open={mediaUploadOpen}
        onClose={() => setMediaUploadOpen(false)}
        onConfirmed={() => {
          setMediaUploadOpen(false);
          doUploadMedia();
        }}
      />
      <UploadPasscodeModal
        open={relAddOpen}
        onClose={() => setRelAddOpen(false)}
        onConfirmed={() => {
          setRelAddOpen(false);
          doAddRelationship();
        }}
      />
      <DeletePasscodeModal
        open={deleteRelOpen}
        onClose={() => setDeleteRelOpen(false)}
        onConfirmed={() => {
          setDeleteRelOpen(false);
          doDeleteRelationship();
        }}
      />
      <DeletePasscodeModal
        open={deletePersonOpen}
        onClose={() => setDeletePersonOpen(false)}
        onConfirmed={() => {
          setDeletePersonOpen(false);
          doDeletePerson();
        }}
      />
    </div>
  );
}
