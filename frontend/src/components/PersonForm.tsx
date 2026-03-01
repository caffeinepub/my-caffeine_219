import React, { useState, useEffect } from 'react';
import { useCreatePerson, useUpdatePerson } from '../hooks/useQueries';
import { ExternalBlob } from '../backend';
import type { Person, PersonId } from '../backend';
import UploadPasscodeModal from './UploadPasscodeModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, User } from 'lucide-react';

interface PersonFormProps {
  person?: Person;
  onBack: () => void;
  onSaved: (id: PersonId) => void;
}

interface FormData {
  fullName: string;
  generationNumber: string;
  father: string;
  mother: string;
  biography: string;
  gender: string;
  birthDate: string;
  deathDate: string;
  country: string;
  province: string;
  city: string;
  nationality: string;
}

const emptyForm = (): FormData => ({
  fullName: '',
  generationNumber: '',
  father: '',
  mother: '',
  biography: '',
  gender: '',
  birthDate: '',
  deathDate: '',
  country: '',
  province: '',
  city: '',
  nationality: '',
});

export default function PersonForm({ person, onBack, onSaved }: PersonFormProps) {
  const createPerson = useCreatePerson();
  const updatePerson = useUpdatePerson();

  const [form, setForm] = useState<FormData>(emptyForm());
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [passcodeOpen, setPasscodeOpen] = useState(false);

  useEffect(() => {
    if (person) {
      setForm({
        fullName: person.fullName,
        generationNumber: person.generationNumber.toString(),
        father: person.father,
        mother: person.mother,
        biography: person.biography,
        gender: person.gender ?? '',
        birthDate: person.birthDate ?? '',
        deathDate: person.deathDate ?? '',
        country: person.country ?? '',
        province: person.province ?? '',
        city: person.city ?? '',
        nationality: person.nationality ?? '',
      });
      if (person.profilePhoto) {
        setPhotoPreview(person.profilePhoto.getDirectURL());
      }
    }
  }, [person]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim()) return;
    setPasscodeOpen(true);
  }

  async function doSave() {
    let photo: ExternalBlob | null = null;
    if (photoFile) {
      const bytes = new Uint8Array(await photoFile.arrayBuffer());
      photo = ExternalBlob.fromBytes(bytes);
    } else if (person?.profilePhoto) {
      photo = person.profilePhoto;
    }

    const params = {
      fullName: form.fullName.trim(),
      generationNumber: BigInt(form.generationNumber || '0'),
      father: form.father.trim(),
      mother: form.mother.trim(),
      bio: form.biography.trim(),
      photo,
      gender: form.gender || null,
      birthDate: form.birthDate || null,
      deathDate: form.deathDate || null,
      country: form.country || null,
      province: form.province || null,
      city: form.city || null,
      nationality: form.nationality || null,
    };

    if (person) {
      await updatePerson.mutateAsync({ id: person.id, ...params });
      onSaved(person.id);
    } else {
      const newId = await createPerson.mutateAsync(params);
      onSaved(newId);
    }
  }

  const isPending = createPerson.isPending || updatePerson.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-ink/60 hover:text-ink">
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回
        </Button>
        <h3 className="text-lg font-serif text-ink font-semibold">
          {person ? '编辑族人信息' : '添加族人'}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Photo */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full border-2 border-ink/20 overflow-hidden bg-parchment-dark flex items-center justify-center">
            {photoPreview ? (
              <img src={photoPreview} alt="头像" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-ink/30" />
            )}
          </div>
          <div>
            <label className="text-xs text-ink/60 mb-1 block">头像照片</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="text-sm text-ink/70 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-seal/10 file:text-seal hover:file:bg-seal/20 cursor-pointer"
            />
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs text-ink/60 mb-1 block">姓名 *</label>
            <Input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="请输入姓名"
              required
              className="bg-parchment-dark border-ink/30"
            />
          </div>
          <div>
            <label className="text-xs text-ink/60 mb-1 block">世代</label>
            <Input
              type="number"
              value={form.generationNumber}
              onChange={(e) => setForm({ ...form, generationNumber: e.target.value })}
              placeholder="第几世"
              min="0"
              className="bg-parchment-dark border-ink/30"
            />
          </div>
          <div>
            <label className="text-xs text-ink/60 mb-1 block">性别</label>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-ink/30 bg-parchment-dark text-ink text-sm focus:outline-none focus:ring-2 focus:ring-seal/30"
            >
              <option value="">未指定</option>
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-ink/60 mb-1 block">民族</label>
            <Input
              value={form.nationality}
              onChange={(e) => setForm({ ...form, nationality: e.target.value })}
              placeholder="如：汉族"
              className="bg-parchment-dark border-ink/30"
            />
          </div>
          <div>
            <label className="text-xs text-ink/60 mb-1 block">父亲</label>
            <Input
              value={form.father}
              onChange={(e) => setForm({ ...form, father: e.target.value })}
              placeholder="父亲姓名"
              className="bg-parchment-dark border-ink/30"
            />
          </div>
          <div>
            <label className="text-xs text-ink/60 mb-1 block">母亲</label>
            <Input
              value={form.mother}
              onChange={(e) => setForm({ ...form, mother: e.target.value })}
              placeholder="母亲姓名"
              className="bg-parchment-dark border-ink/30"
            />
          </div>
          <div>
            <label className="text-xs text-ink/60 mb-1 block">出生日期</label>
            <Input
              value={form.birthDate}
              onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
              placeholder="如：1950-01-01"
              className="bg-parchment-dark border-ink/30"
            />
          </div>
          <div>
            <label className="text-xs text-ink/60 mb-1 block">逝世日期</label>
            <Input
              value={form.deathDate}
              onChange={(e) => setForm({ ...form, deathDate: e.target.value })}
              placeholder="如：2020-12-31"
              className="bg-parchment-dark border-ink/30"
            />
          </div>
        </div>

        {/* Location */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs text-ink/60 mb-1 block">国家</label>
            <Input
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              placeholder="国家"
              className="bg-parchment-dark border-ink/30"
            />
          </div>
          <div>
            <label className="text-xs text-ink/60 mb-1 block">省份</label>
            <Input
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
              placeholder="省份"
              className="bg-parchment-dark border-ink/30"
            />
          </div>
          <div>
            <label className="text-xs text-ink/60 mb-1 block">城市</label>
            <Input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="城市"
              className="bg-parchment-dark border-ink/30"
            />
          </div>
        </div>

        {/* Biography */}
        <div>
          <label className="text-xs text-ink/60 mb-1 block">个人简介</label>
          <textarea
            value={form.biography}
            onChange={(e) => setForm({ ...form, biography: e.target.value })}
            placeholder="请输入个人简介..."
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-ink/30 bg-parchment-dark text-ink text-sm resize-y focus:outline-none focus:ring-2 focus:ring-seal/30"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={onBack}>
            取消
          </Button>
          <Button
            type="submit"
            disabled={isPending || !form.fullName.trim()}
            className="bg-seal hover:bg-seal/90 text-parchment"
          >
            <Save className="w-4 h-4 mr-1" />
            {isPending ? '保存中...' : '保存'}
          </Button>
        </div>
      </form>

      {/* Use `open` prop (not `isOpen`) */}
      <UploadPasscodeModal
        open={passcodeOpen}
        onClose={() => setPasscodeOpen(false)}
        onConfirmed={() => {
          setPasscodeOpen(false);
          doSave();
        }}
      />
    </div>
  );
}
