import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    } else {
        this.logger.warn('GEMINI_API_KEY is not set');
    }
  }

  /**
   * Google Gemini Vision API ile Ürün görselini analiz eder.
   * @param imageBase64 - Görüntünün Base64 formatı
   * @returns Analiz sonucu (JSON)
   */
  async analyzeProductImage(imageBase64: string): Promise<any> {
    if (!this.model) {
      throw new Error('AI Model başlatılamadı (API Key Eksik)');
    }

    const prompt = `
      Sen uzman bir gıda denetçisisin. Sana verilen resimdeki ürünü analiz et.
      
      Eğer bu bir gıda/içecek ürünü DEĞİLSE veya net bir şekilde anlaşılmıyorsa:
      Sadece {"isFood": false} döndür.

      Eğer bu bir gıda ürünü ise:
      Aşağıdaki JSON formatında verileri çıkar. Asla markdown kullanma, sadece saf JSON string döndür.
      
      {
        "isFood": true,
        "product": {
          "brand": "Marka",
          "name": "Ürün Adı",
          "quantity": "500g, 1L vb"
        },
        "content": {
          "ingredients": "İçindekiler listesi text olarak",
          "allergens": "Alerjen uyarısı var mı?",
          "nutrition": {
             "calories": 0,
             "protein": 0,
             "carbohydrates": 0,
             "fat": 0,
             "sugars": 0,
             "salt": 0
          }
        },
        "analysis": "Ürünün içeriği hakkında kısa, objektif ama uyarıcı bir analiz yazısı (2-3 cümle). Özellikle zararlı katkı maddeleri veya yüksek şeker/yağ oranlarına dikkat çek."
      }
    `;

    try {
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType: 'image/jpeg',
          },
        },
      ]);

      const response = await result.response;
      let text = response.text();
      
      // Markdown temizliği (Bazen ```json ... ``` dönebilir)
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      return JSON.parse(text);
    } catch (error) {
      this.logger.error('Gemini Analizi Başarısız Oldu', error);
      throw error;
    }
  }
}
