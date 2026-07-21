import { useState, type ChangeEvent, type FormEvent } from 'react';
import cn from 'classnames';
import Modal from '../../components/Modal.js';
import ConfirmModal from '../../components/ConfirmModal.js';
import Button from '../../components/Button.js';
import Field from '../../components/Field.js';
import SelectField from '../../components/SelectField.js';
import SegmentedControl from '../../components/SegmentedControl.js';
import { api } from '../../api/client.js';
import { useProfile } from '../../context/ProfileContext.js';
import { useToast } from '../../context/ToastContext.js';
import { useI18n } from '../../i18n.js';
import { TEXT_LIMITS } from '../../lib/config.js';
import type { Tag } from '../../types.js';

type Tab = 'modify' | 'add' | 'remove';

const TAB_COLORS = {
  modify: 'Blue',
  add: 'Green',
  remove: 'Blue',
} as const;

const DARK_SURFACES = {
  modify: 'dark:[&_input]:bg-paper-blue dark:[&_input]:border-[#29415d] dark:[&_select]:bg-paper-blue dark:[&_select]:border-[#29415d]',
  add: 'dark:[&_input]:bg-paper-green dark:[&_input]:border-[#31564a] dark:[&_select]:bg-paper-green dark:[&_select]:border-[#31564a]',
  remove: 'dark:[&_input]:bg-paper-blue dark:[&_input]:border-[#29415d] dark:[&_select]:bg-paper-blue dark:[&_select]:border-[#29415d]',
} as const;

interface Props {
  tags: Tag[];
  selectedTag: string;
  onClose: () => void;
  onChange: (name: string, changedTag?: string) => void;
}

export default function ManageTagsModal({ tags, selectedTag, onClose, onChange }: Props) {
  const { profileId } = useProfile();
  const { showError, showToast } = useToast();
  const { t } = useI18n();
  const initialTag = tags.find((tag) => tag.name === selectedTag) ?? tags[0];
  const [tab, setTab] = useState<Tab>('modify');
  const [selectedTagId, setSelectedTagId] = useState<number | null>(initialTag?.id ?? null);
  const [name, setName] = useState(initialTag?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState<Tag | null>(null);
  const selected = tags.find((tag) => tag.id === selectedTagId);
  const protectedTag = selected?.protected ?? false;
  const tagOptions = tags.map((tag) => ({ value: tag.id, label: tag.name }));

  function selectTag(id: string) {
    const tag = tags.find((item) => item.id === Number(id));
    if (!tag) return;
    setSelectedTagId(tag.id);
    setName(tag.name);
  }

  async function remove(tag: Tag) {
    setSaving(true);
    try {
      const result = await api.del(`/profiles/${profileId}/tags/${tag.id}`) as { name: string };
      showToast(t('toast.tagDeleted'), 'success');
      onChange(result.name, tag.name);
    } catch (err) {
      showError(err);
      setConfirming(null);
    } finally {
      setSaving(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (tab === 'remove') {
      if (protectedTag) return showError(t('tagsModal.protected'));
      if (selected) setConfirming(selected);
      return;
    }

    const tagToModify = tab === 'modify' ? selected : null;
    if (tab === 'modify' && !tagToModify) return;
    if (tab === 'modify' && protectedTag) return showError(t('tagsModal.protected'));
    setSaving(true);
    try {
      if (tagToModify) {
        const result = await api.put(`/profiles/${profileId}/tags/${tagToModify.id}`, { name }) as { name: string };
        showToast(t('toast.tagUpdated'), 'success');
        onChange(result.name, tagToModify.name);
      } else {
        const result = await api.post(`/profiles/${profileId}/tags`, { name }) as { name: string };
        showToast(t('toast.tagAdded'), 'success');
        onChange(result.name);
      }
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  }

  if (confirming) {
    return (
      <ConfirmModal
        open
        title={t('tagsModal.removeTitle')}
        message={t('tagsModal.removeMessage', { name: confirming.name, count: confirming.usage_count })}
        confirmLabel={t('tagsModal.remove')}
        variant="danger-active"
        disabled={saving}
        onConfirm={() => { void remove(confirming); }}
        onCancel={() => setConfirming(null)}
      />
    );
  }

  return (
    <Modal title={t('tagsModal.title')} onClose={onClose} bgColor={TAB_COLORS[tab]}>
      <form className={cn('flex flex-col gap-4', DARK_SURFACES[tab])} onSubmit={submit}>
        <SegmentedControl
          ariaLabel={t('tagsModal.tabs')}
          items={[
            { value: 'modify', label: t('tagsModal.modify') },
            { value: 'add', label: t('tagsModal.add') },
            { value: 'remove', label: t('tagsModal.remove') },
          ]}
          value={tab}
          onChange={setTab}
          full
        />

        {tab !== 'add' && (
          <SelectField
            id="manage-tags-select"
            label={t('common.tags')}
            value={selectedTagId ?? ''}
            placeholder={t('tagsModal.select')}
            groups={[{ key: 'tags', options: tagOptions }]}
            onChange={selectTag}
          />
        )}

        {tab !== 'remove' && (
          <Field label={t('tagsModal.name')} htmlFor="manage-tags-name">
            <input
              id="manage-tags-name"
              type="text"
              value={name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              maxLength={TEXT_LIMITS.tag}
              required
              autoFocus
            />
          </Field>
        )}

        {protectedTag && tab !== 'add' && <p className="m-0 text-sm text-muted">{t('tagsModal.protected')}</p>}
        <div className="flex justify-between gap-2.5 mt-1">
          <Button variant="danger-active" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant='primary' disabled={saving || (tab !== 'add' && !selected)}>
            {saving ? t('common.saving') : t('common.accept')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
