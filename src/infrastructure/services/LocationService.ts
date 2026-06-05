// Servizio geolocalizzazione — RQ-28: consumo GPS < 10% l'ora
// Usa Balanced Accuracy per ridurre consumo batteria.
import * as Location from 'expo-location';
import { PosizioneMancante } from '../../domain/entities';

export interface Coordinate {
  latitudine: number;
  longitudine: number;
}

export class LocationService {
  async richiediPermesso(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  }

  async getPosizione(): Promise<Coordinate> {
    const hasPermission = await this.richiediPermesso();
    if (!hasPermission) {
      throw new PosizioneMancante();
    }

    // RQ-28: Balanced accuracy — evita GPS continuo ad alta frequenza
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitudine: loc.coords.latitude,
      longitudine: loc.coords.longitude,
    };
  }

  // Calcola distanza in km tra due coordinate (formula Haversine)
  calcolaDistanzaKm(
    lat1: number, lng1: number,
    lat2: number, lng2: number
  ): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
