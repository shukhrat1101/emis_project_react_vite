import axiosInstance from "./axiosInstance";

export interface MilitaryServiceman {
  id: number;
  rank: string;
  full_name: string;
  position: string;
  military_unit: string;
  pinfl: string;
}

export interface ParticipantItem {
  id: number;
  military_serviceman: MilitaryServiceman;
}

export interface CompetitionParticipantBlock {
  id: number;
  competition: string;
  participants: ParticipantItem[];
}

export interface CompetitionParticipantsResponse {
  total: number;
  page: number;
  page_size: number;
  results: CompetitionParticipantBlock[];
}

export interface FlatParticipant {
  participant_id: number;
  competition_id: number;
  competition: string;
  serviceman: MilitaryServiceman;
}

export interface CreateParticipantPayload {
  competition: number;
  military_serviceman: number;
}

const BASE_URL = "/competition/competition-participant/";

const participantService = {
  listByCompetition: async (
    competitionId: number | string,
    params?: { page?: number; page_size?: number }
  ): Promise<CompetitionParticipantsResponse> => {
    const { data } = await axiosInstance.get<CompetitionParticipantsResponse>(
      `${BASE_URL}${competitionId}/list/`,
      { params }
    );
    return data;
  },

  listFlat: async (
    competitionId: number | string,
    params?: { page?: number; page_size?: number }
  ): Promise<{ total: number; page: number; page_size: number; results: FlatParticipant[] }> => {
    const res = await participantService.listByCompetition(competitionId, params);
    const results: FlatParticipant[] =
      res.results.flatMap((block) =>
        (block.participants || []).map((p) => ({
          participant_id: p.id,
          competition_id: block.id,
          competition: block.competition,
          serviceman: p.military_serviceman,
        }))
      ) || [];
    return { total: res.total, page: res.page, page_size: res.page_size, results };
  },

  create: async (payload: CreateParticipantPayload): Promise<ParticipantItem> => {
    const { data } = await axiosInstance.post<ParticipantItem>(`${BASE_URL}create/`, payload);
    return data;
  },

  delete: async (participantId: number | string): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}delete/${participantId}/`);
  },
};

export default participantService;
