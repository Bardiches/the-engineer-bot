import axios from 'axios';
// /app/getAudioFile5

export interface AIRequest {
  character: string;
  emotion: string;
  text: string;
}

export interface AIResponse {
  batch: number[];
  wavNames: string[];
  scores: number[];
  text_parsed: string;
  tokenized: string;
}

const sleep = async (time: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), time));

export const getAI = async (request: AIRequest, retries = 5): Promise<AIResponse> => {
  try {
    const { data } = await axios.post<AIResponse>('https://api.15.ai/app/getAudioFile5', request, {
      headers: {
        "accept": "application/json, text/plain, */*",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "en-US,en;q=0.9",
        "access-control-allow-origin": "*",
        "content-type": "application/json;charset=UTF-8",
        "origin": "https://fifteen.ai",
        "referer": "https://fifteen.ai/app",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
      },
    });

    return data;
  } catch (error) {
    console.error(error);

    if (retries) {
      await sleep(1500);
      return getAI(request, retries - 1);
    }

    throw error;
  }
}

export const getAIWav = async (filename: string, retries = 5): Promise<Buffer> => {
  try {
    const { data } = await axios.get(`https://cdn.15.ai/audio/${filename}`, { responseType: 'arraybuffer' });

    return data;
  } catch (error) {
    console.error(error);

    if (retries) {
      await sleep(1500);
      return getAIWav(filename, retries - 1);
    }

    throw error;
  }
}
