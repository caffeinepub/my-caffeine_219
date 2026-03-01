import { useState, useRef } from 'react';
import {
  Calendar,
  Plus,
  ArrowLeft,
  Pencil,
  Trash2,
  ImagePlus,
  Loader2,
  X,
  RefreshCw,
} from 'lucide-react';
import type { Activity, ActivityImage } from '../backend';
import {
  useListActivities,
  useGetActivity,
  useListActivityImages,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
  useUploadActivityImage,
  useDeleteActivityImage,
} from '../hooks/useQueries';
import UploadPasscodeModal from './UploadPasscodeModal';
import DeletePasscodeModal from './DeletePasscodeModal';

// ─── Image Gallery ────────────────────────────────────────────────────────────

function ActivityImageGallery({ activityId }: { activityId: bigint }) {
  const { data: images = [], isLoading, refetch } = useListActivityImages(activityId);
  const uploadImage = useUploadActivityImage();
  const deleteImage = useDeleteActivityImage();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<bigint | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setUploadError('仅支持 JPG 和 PNG 格式的图片');
      return;
    }
    setUploadError('');
    setSelectedFile(file);
    setShowUploadModal(true);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadConfirmed = async () => {
    if (!selectedFile) return;
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      await uploadImage.mutateAsync({
        activityId,
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        data,
      });
      setSelectedFile(null);
      setShowUploadModal(false);
    } catch (err) {
      setUploadError((err as Error).message);
      setShowUploadModal(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (deleteTarget === null) return;
    try {
      await deleteImage.mutateAsync({ imageId: deleteTarget, activityId });
      setDeleteTarget(null);
      setShowDeleteModal(false);
    } catch (err) {
      setShowDeleteModal(false);
    }
  };

  const getImageSrc = (image: ActivityImage): string => {
    const blob = new Blob([new Uint8Array(image.data)], { type: image.mimeType });
    return URL.createObjectURL(blob);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-serif text-sm font-semibold text-ink-700 tracking-wide">活动图片</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-1 text-ink-400 hover:text-ink-700 transition-colors"
            title="刷新图片"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-gold/20 border border-gold/40 text-ink-700 rounded text-xs font-serif hover:bg-gold/30 transition-colors cursor-pointer">
            <ImagePlus className="w-3.5 h-3.5" />
            上传图片
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {uploadError && (
        <p className="text-xs text-red-500 font-serif mb-2">{uploadError}</p>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-ink-400 text-sm font-serif">
          <Loader2 className="w-4 h-4 animate-spin" />
          加载图片中...
        </div>
      ) : images.length === 0 ? (
        <div className="border border-dashed border-parchment-300 rounded-sm py-8 text-center">
          <ImagePlus className="w-8 h-8 text-parchment-400 mx-auto mb-2" />
          <p className="text-xs text-ink-400 font-serif">暂无图片，点击上传图片按钮添加</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((image) => (
            <div key={image.id.toString()} className="relative group aspect-square">
              <img
                src={getImageSrc(image)}
                alt={image.fileName}
                className="w-full h-full object-cover rounded-sm border border-parchment-200"
              />
              <div className="absolute inset-0 bg-ink-900/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-sm flex items-center justify-center">
                <button
                  onClick={() => { setDeleteTarget(image.id); setShowDeleteModal(true); }}
                  className="p-1.5 bg-seal-600 text-white rounded-full hover:bg-seal-700 transition-colors"
                  title="删除图片"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-ink-500 font-serif mt-1 truncate">{image.fileName}</p>
            </div>
          ))}
        </div>
      )}

      <UploadPasscodeModal
        open={showUploadModal}
        onClose={() => { setShowUploadModal(false); setSelectedFile(null); }}
        onConfirmed={handleUploadConfirmed}
        isLoading={uploadImage.isPending}
      />

      <DeletePasscodeModal
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
        onConfirmed={handleDeleteConfirmed}
        itemName="此图片"
        isLoading={deleteImage.isPending}
      />
    </div>
  );
}

// ─── Activity Detail View ─────────────────────────────────────────────────────

interface ActivityDetailProps {
  activityId: bigint;
  onBack: () => void;
}

function ActivityDetail({ activityId, onBack }: ActivityDetailProps) {
  const { data: activity, isLoading, refetch } = useGetActivity(activityId);
  const updateActivity = useUpdateActivity();
  const deleteActivity = useDeleteActivity();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editError, setEditError] = useState('');

  const [showEditPasscode, setShowEditPasscode] = useState(false);
  const [showDeletePasscode, setShowDeletePasscode] = useState(false);

  const startEdit = () => {
    if (!activity) return;
    setEditTitle(activity.title);
    setEditDate(activity.eventDate);
    setEditDesc(activity.description);
    setEditError('');
    setIsEditing(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editDate.trim()) {
      setEditError('请填写活动名称和日期');
      return;
    }
    setEditError('');
    setShowEditPasscode(true);
  };

  const handleEditConfirmed = async () => {
    try {
      await updateActivity.mutateAsync({
        id: activityId,
        title: editTitle.trim(),
        eventDate: editDate,
        description: editDesc.trim(),
      });
      setIsEditing(false);
      setShowEditPasscode(false);
      refetch();
    } catch (err) {
      setEditError((err as Error).message);
      setShowEditPasscode(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    try {
      await deleteActivity.mutateAsync(activityId);
      setShowDeletePasscode(false);
      onBack();
    } catch (err) {
      setShowDeletePasscode(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-ink-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span className="font-serif">加载活动详情中...</span>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="text-center py-12 font-serif text-ink-400">
        <p>活动不存在或已被删除</p>
        <button onClick={onBack} className="mt-2 text-seal-600 underline text-sm">返回列表</button>
      </div>
    );
  }

  const formattedDate = new Date(activity.eventDate).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-serif text-ink-500 hover:text-ink-800 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        返回活动列表
      </button>

      {/* Activity header */}
      <div className="bg-card border border-parchment-300 rounded-sm p-5 mb-5">
        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-serif text-ink-600 mb-1">活动名称 *</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full border border-parchment-300 rounded px-3 py-2 text-sm font-serif text-ink-800 bg-white focus:outline-none focus:ring-2 focus:ring-seal-400"
              />
            </div>
            <div>
              <label className="block text-xs font-serif text-ink-600 mb-1">活动日期 *</label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full border border-parchment-300 rounded px-3 py-2 text-sm font-serif text-ink-800 bg-white focus:outline-none focus:ring-2 focus:ring-seal-400"
              />
            </div>
            <div>
              <label className="block text-xs font-serif text-ink-600 mb-1">活动描述</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={4}
                className="w-full border border-parchment-300 rounded px-3 py-2 text-sm font-serif text-ink-800 bg-white focus:outline-none focus:ring-2 focus:ring-seal-400 resize-none"
              />
            </div>
            {editError && <p className="text-xs text-red-500 font-serif">{editError}</p>}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-1 px-3 py-1.5 border border-parchment-300 text-ink-700 rounded text-sm font-serif hover:bg-parchment-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                取消
              </button>
              <button
                type="submit"
                disabled={updateActivity.isPending}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-seal-600 text-white rounded text-sm font-serif hover:bg-seal-700 disabled:opacity-50 transition-colors"
              >
                {updateActivity.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                保存修改
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-xl font-bold text-ink-900 tracking-wide">{activity.title}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-seal-500" />
                  <span className="text-sm font-serif text-seal-600">{formattedDate}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={startEdit}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gold/40 text-ink-700 rounded text-xs font-serif hover:bg-gold/10 transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  编辑
                </button>
                <button
                  onClick={() => setShowDeletePasscode(true)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-seal-300 text-seal-600 rounded text-xs font-serif hover:bg-seal-50 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  删除活动
                </button>
              </div>
            </div>
            {activity.description && (
              <p className="mt-3 text-sm font-serif text-ink-700 leading-relaxed whitespace-pre-wrap border-t border-parchment-200 pt-3">
                {activity.description}
              </p>
            )}
          </>
        )}
      </div>

      {/* Image gallery */}
      <div className="bg-card border border-parchment-300 rounded-sm p-5">
        <ActivityImageGallery activityId={activityId} />
      </div>

      <UploadPasscodeModal
        open={showEditPasscode}
        onClose={() => setShowEditPasscode(false)}
        onConfirmed={handleEditConfirmed}
        isLoading={updateActivity.isPending}
      />

      <DeletePasscodeModal
        open={showDeletePasscode}
        onClose={() => setShowDeletePasscode(false)}
        onConfirmed={handleDeleteConfirmed}
        itemName={activity.title}
        isLoading={deleteActivity.isPending}
      />
    </div>
  );
}

// ─── Activity Card ────────────────────────────────────────────────────────────

function ActivityCard({ activity, onView }: { activity: Activity; onView: () => void }) {
  const formattedDate = new Date(activity.eventDate).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const descPreview = activity.description.length > 80
    ? activity.description.slice(0, 80) + '...'
    : activity.description;

  return (
    <div className="bg-card border border-parchment-300 rounded-sm p-4 hover:border-gold/60 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-serif font-semibold text-ink-800 text-base tracking-wide truncate">{activity.title}</h4>
          <div className="flex items-center gap-1.5 mt-1">
            <Calendar className="w-3.5 h-3.5 text-seal-500 flex-shrink-0" />
            <span className="text-xs font-serif text-seal-600">{formattedDate}</span>
          </div>
          {descPreview && (
            <p className="text-xs font-serif text-ink-500 mt-2 leading-relaxed">{descPreview}</p>
          )}
        </div>
        <button
          onClick={onView}
          className="flex-shrink-0 px-3 py-1.5 bg-seal-600 text-white rounded text-xs font-serif hover:bg-seal-700 transition-colors"
        >
          查看详情
        </button>
      </div>
    </div>
  );
}

// ─── Main FamilyActivities Component ─────────────────────────────────────────

export default function FamilyActivities() {
  const { data: activities = [], isLoading, isError, refetch } = useListActivities();
  const createActivity = useCreateActivity();

  const [selectedActivityId, setSelectedActivityId] = useState<bigint | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [formError, setFormError] = useState('');
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [pendingActivity, setPendingActivity] = useState<{ title: string; eventDate: string; description: string } | null>(null);

  // If viewing a specific activity
  if (selectedActivityId !== null) {
    return (
      <ActivityDetail
        activityId={selectedActivityId}
        onBack={() => setSelectedActivityId(null)}
      />
    );
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate.trim()) {
      setFormError('请填写活动名称和日期');
      return;
    }
    setFormError('');
    setPendingActivity({ title: newTitle.trim(), eventDate: newDate, description: newDesc.trim() });
    setShowPasscodeModal(true);
  };

  const handlePasscodeConfirmed = async () => {
    if (!pendingActivity) return;
    try {
      await createActivity.mutateAsync(pendingActivity);
      setNewTitle('');
      setNewDate('');
      setNewDesc('');
      setPendingActivity(null);
      setShowPasscodeModal(false);
      setShowNewForm(false);
    } catch (err) {
      setFormError((err as Error).message);
      setShowPasscodeModal(false);
    }
  };

  // Sort activities by eventDate ascending
  const sortedActivities = [...activities].sort((a, b) =>
    a.eventDate.localeCompare(b.eventDate)
  );

  return (
    <section>
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-seal-600" />
          <h2 className="font-serif text-xl font-bold text-ink-900 tracking-wider">家族活动安排</h2>
          <span className="text-xs text-ink-400 font-serif border border-parchment-300 px-2 py-0.5 rounded-full">
            {activities.length} 项活动
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-1.5 text-ink-400 hover:text-ink-700 transition-colors"
            title="刷新"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-seal-600 text-white rounded text-sm font-serif hover:bg-seal-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加活动
          </button>
        </div>
      </div>

      {/* New activity form */}
      {showNewForm && (
        <div className="mb-5 bg-parchment-50 border border-parchment-300 rounded-sm p-4">
          <h3 className="font-serif text-sm font-semibold text-ink-800 mb-3 tracking-wide">✚ 添加新活动</h3>
          <form onSubmit={handleFormSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-serif text-ink-600 mb-1">活动名称 *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="活动名称"
                  className="w-full border border-parchment-300 rounded px-3 py-2 text-sm font-serif text-ink-800 bg-white focus:outline-none focus:ring-2 focus:ring-seal-400"
                />
              </div>
              <div>
                <label className="block text-xs font-serif text-ink-600 mb-1">活动日期 *</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full border border-parchment-300 rounded px-3 py-2 text-sm font-serif text-ink-800 bg-white focus:outline-none focus:ring-2 focus:ring-seal-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-serif text-ink-600 mb-1">活动描述</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="活动详情描述..."
                rows={3}
                className="w-full border border-parchment-300 rounded px-3 py-2 text-sm font-serif text-ink-800 bg-white focus:outline-none focus:ring-2 focus:ring-seal-400 resize-none"
              />
            </div>
            {formError && <p className="text-xs text-red-500 font-serif">{formError}</p>}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowNewForm(false); setFormError(''); }}
                className="px-4 py-2 border border-parchment-300 text-ink-700 rounded text-sm font-serif hover:bg-parchment-100 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={createActivity.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-seal-600 text-white rounded text-sm font-serif hover:bg-seal-700 disabled:opacity-50 transition-colors"
              >
                {createActivity.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                添加活动
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Activities list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-ink-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="font-serif">加载活动中...</span>
        </div>
      ) : isError ? (
        <div className="text-center py-12 text-seal-600 font-serif">
          <p>加载失败，请稍后重试</p>
          <button onClick={() => refetch()} className="mt-2 text-sm underline">重新加载</button>
        </div>
      ) : sortedActivities.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-parchment-300 rounded-sm">
          <Calendar className="w-10 h-10 text-parchment-400 mx-auto mb-3" />
          <p className="font-serif text-ink-400 text-sm">暂无活动安排，点击上方按钮添加</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedActivities.map((activity) => (
            <ActivityCard
              key={activity.id.toString()}
              activity={activity}
              onView={() => setSelectedActivityId(activity.id)}
            />
          ))}
        </div>
      )}

      <UploadPasscodeModal
        open={showPasscodeModal}
        onClose={() => { setShowPasscodeModal(false); setPendingActivity(null); }}
        onConfirmed={handlePasscodeConfirmed}
        isLoading={createActivity.isPending}
      />
    </section>
  );
}
