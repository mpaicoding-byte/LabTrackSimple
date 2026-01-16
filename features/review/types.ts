export type ReviewRow = {
  id: string;
  name_raw: string;
  value_raw: string;
  unit_raw: string | null;
  value_num: number | null;
  details_raw: string | null;
  edited_at: string | null;
};

export type ReviewDraft = {
  name_raw: string;
  value_raw: string;
  unit_raw: string;
  value_num: string;
  details_raw: string;
};
