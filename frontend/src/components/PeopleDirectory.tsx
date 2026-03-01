import { useState } from 'react';
import { useListPeople, useDeletePerson } from '../hooks/useQueries';
import type { Person, PersonId } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPlus, Search, Users, Trash2, Edit, Eye } from 'lucide-react';
import PersonProfile from './PersonProfile';
import PersonForm from './PersonForm';
import DeletePasscodeModal from './DeletePasscodeModal';

type View = 'list' | 'profile' | 'add' | 'edit';

export default function PeopleDirectory() {
  const { data: people, isLoading } = useListPeople();
  const deleteMutation = useDeletePerson();

  const [view, setView] = useState<View>('list');
  const [selectedPersonId, setSelectedPersonId] = useState<PersonId | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Delete passcode modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<PersonId | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState<string>('');

  const filteredPeople = people?.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.generationNumber.toString().includes(q)
    );
  });

  const selectedPerson: Person | undefined =
    selectedPersonId !== null ? people?.find((p) => p.id === selectedPersonId) : undefined;

  const handleViewProfile = (id: PersonId) => {
    setSelectedPersonId(id);
    setView('profile');
  };

  const handleEdit = (id: PersonId) => {
    setSelectedPersonId(id);
    setView('edit');
  };

  const handleDeleteClick = (id: PersonId, name: string) => {
    setPendingDeleteId(id);
    setPendingDeleteName(name);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    setShowDeleteModal(false);
    if (pendingDeleteId === null) return;
    await deleteMutation.mutateAsync(pendingDeleteId);
    if (selectedPersonId === pendingDeleteId) {
      setView('list');
      setSelectedPersonId(null);
    }
    setPendingDeleteId(null);
    setPendingDeleteName('');
  };

  // After form saved: navigate to the saved person's profile
  const handleFormSaved = (newPersonId: PersonId) => {
    setSelectedPersonId(newPersonId);
    setView('profile');
  };

  const handleBack = () => {
    setView('list');
    setSelectedPersonId(null);
  };

  // Profile view — pass the full `person` object (required by PersonProfile)
  if (view === 'profile' && selectedPerson !== undefined) {
    return (
      <PersonProfile
        person={selectedPerson}
        onBack={handleBack}
        onEdit={() => handleEdit(selectedPerson.id)}
      />
    );
  }

  if (view === 'add') {
    return (
      <PersonForm
        onBack={handleBack}
        onSaved={handleFormSaved}
      />
    );
  }

  if (view === 'edit' && selectedPerson !== undefined) {
    return (
      <PersonForm
        person={selectedPerson}
        onBack={() => {
          if (selectedPersonId !== null) setView('profile');
          else handleBack();
        }}
        onSaved={handleFormSaved}
      />
    );
  }

  return (
    <section className="space-y-6">
      {/* Delete passcode modal */}
      <DeletePasscodeModal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setPendingDeleteId(null);
          setPendingDeleteName('');
        }}
        onConfirmed={handleDeleteConfirmed}
        itemName={pendingDeleteName}
        isLoading={deleteMutation.isPending}
      />

      {/* Section header */}
      <div className="flex items-center justify-between pb-4 border-b-2 border-gold/40">
        <div className="flex items-center gap-4">
          <img
            src="/assets/generated/icon-people.dim_128x128.png"
            alt="人物整理"
            className="w-14 h-14 object-contain"
          />
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground tracking-wider">
              人物整理
            </h2>
            <p className="text-muted-foreground text-sm font-serif mt-0.5">
              记录邓氏族人的生平事迹与家族关系
            </p>
          </div>
        </div>
        <Button
          onClick={() => setView('add')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-serif tracking-wide"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          添加族人
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索姓名或代数..."
          className="pl-9 border-gold/40 font-serif"
        />
      </div>

      {/* People grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-36 rounded-sm" />
          ))}
        </div>
      ) : filteredPeople && filteredPeople.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPeople.map((person) => (
            <PersonCard
              key={person.id.toString()}
              person={person}
              onView={() => handleViewProfile(person.id)}
              onEdit={() => handleEdit(person.id)}
              onDelete={() => handleDeleteClick(person.id, person.fullName)}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-gold/30 rounded-sm">
          <Users className="w-12 h-12 text-gold/40 mx-auto mb-3" />
          <p className="font-serif text-muted-foreground">
            {searchQuery ? '未找到匹配的族人' : '暂无族人记录'}
          </p>
          {!searchQuery && (
            <p className="font-serif text-muted-foreground text-sm mt-1">
              点击「添加族人」开始录入族人信息
            </p>
          )}
        </div>
      )}
    </section>
  );
}

interface PersonCardProps {
  person: Person;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function PersonCard({ person, onView, onEdit, onDelete, isDeleting }: PersonCardProps) {
  const generationLabel = `第${person.generationNumber}世`;

  return (
    <Card className="border-gold/30 shadow-xs hover:shadow-manuscript transition-shadow bg-card">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-sm overflow-hidden border border-gold/30 flex-shrink-0 bg-muted">
            {person.profilePhoto ? (
              <img
                src={person.profilePhoto.getDirectURL()}
                alt={person.fullName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary">
                <span className="font-serif text-xl font-bold text-muted-foreground">
                  {person.fullName.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif font-bold text-base truncate">{person.fullName}</h3>
              <Badge variant="outline" className="text-xs border-gold/40 text-muted-foreground font-serif flex-shrink-0">
                {generationLabel}
              </Badge>
            </div>
            {(person.father || person.mother) && (
              <p className="text-xs text-muted-foreground font-serif mt-1 truncate">
                {person.father && `父：${person.father}`}
                {person.father && person.mother && ' · '}
                {person.mother && `母：${person.mother}`}
              </p>
            )}
            {person.biography && (
              <p className="text-xs text-muted-foreground font-serif mt-1 line-clamp-2">
                {person.biography}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-gold/20">
          <Button
            variant="outline"
            size="sm"
            onClick={onView}
            className="flex-1 border-gold/40 font-serif text-xs hover:bg-accent"
          >
            <Eye className="w-3 h-3 mr-1" />
            查看
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="border-gold/40 font-serif text-xs hover:bg-accent"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isDeleting}
            onClick={onDelete}
            className="border-seal/30 text-seal hover:bg-seal/10 font-serif text-xs"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
