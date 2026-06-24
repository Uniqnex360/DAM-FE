import { api } from "../lib/api";

export interface Room {
  id: string;
  label: string;
  emoji: string;
  floor_y: number;
  scale_hint: number;
}

export interface VisualizeResponse {
  image: string; // Base64 Data URL
  room_id: string;
  scale: number;
}

class VisualizerService {
  /**
   * Returns metadata for all pre-configured rooms
   */
  async getRooms(): Promise<Room[]> {
    const { data } = await api.get<Room[]>('/room-visualizer/rooms');
    return data;
  }
    async getCutout(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('product_image', file);
  const { data } = await api.post('/room-visualizer/remove-bg', formData);
  return data.cutout; // Transparent PNG
    }
    async recolorRoom(formData: FormData) {
  const { data } = await api.post('/room-visualizer/recolor-room', formData);
  return data;
}

  /**
   * Uploads product and returns the composited AR image
   */
  async generatePreview(
    file: File,
    roomId: string,
    scale: number,
    xPercent: number,
    yPercent: number
  ): Promise<VisualizeResponse> {
    const formData = new FormData();
    formData.append('product_image', file);
    formData.append('room_id', roomId);
    formData.append('scale', scale.toString());
    formData.append('x_percent', xPercent.toString());
    formData.append('y_percent', yPercent.toString());

    const { data } = await api.post<VisualizeResponse>(
      '/room-visualizer/composite', 
      formData, 
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    
    return data;
  }
}


export const visualizerService = new VisualizerService();