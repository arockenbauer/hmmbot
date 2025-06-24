import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../../data/tickets.json');

export class TicketStorage {
  static loadTickets() {
    if (!fs.existsSync(dataPath)) return {};
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  }

  static saveTickets(data) {
    const dir = path.dirname(dataPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  }

  static getUserTickets(userId) {
    const data = this.loadTickets();
    return Object.values(data).filter(t => t.userId === userId && t.status === 'open');
  }

  static addTicket(ticketId, userId, channelId, customFields = {}) {
    const data = this.loadTickets();
    data[ticketId] = { userId, channelId, createdAt: Date.now(), status: 'open', messages: [], customFields };
    this.saveTickets(data);
  }

  static closeTicket(ticketId) {
    const data = this.loadTickets();
    if (data[ticketId]) data[ticketId].status = 'closed';
    this.saveTickets(data);
  }

  static addMessage(ticketId, message) {
    const data = this.loadTickets();
    if (data[ticketId]) {
      data[ticketId].messages.push(message);
      this.saveTickets(data);
    }
  }

  static getTicket(ticketId) {
    const data = this.loadTickets();
    return data[ticketId];
  }
}
