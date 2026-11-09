namespace Soykok.Domain.Common;

/// <summary>Bir iş kuralı ihlal edildiğinde fırlatılır (ör. negatif fiyat).</summary>
public sealed class DomainException(string message) : Exception(message);
