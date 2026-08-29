"""SM-2 spaced repetition algorithm implementation."""

from datetime import date, timedelta


def sm2(quality: int, repetitions: int, interval: int, easiness_factor: float) -> tuple[int, int, float, date]:
    """
    SM-2 algorithm for spaced repetition scheduling.

    Args:
        quality: Review quality rating (0-5)
            0 = total blackout
            1 = wrong, but recognized on reveal
            2 = wrong, but easy to recall after seeing answer
            3 = correct with serious difficulty
            4 = correct with some hesitation
            5 = perfect recall
        repetitions: Number of consecutive correct reviews
        interval: Current interval in days
        easiness_factor: Current easiness factor (min 1.3)

    Returns:
        Tuple of (new_repetitions, new_interval, new_easiness_factor, next_review_date)
    """
    if quality >= 3:
        # Correct response
        if repetitions == 0:
            new_interval = 1
        elif repetitions == 1:
            new_interval = 6
        else:
            new_interval = round(interval * easiness_factor)
        new_repetitions = repetitions + 1
    else:
        # Incorrect response — reset
        new_repetitions = 0
        new_interval = 1

    # Update easiness factor
    new_ef = easiness_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    new_ef = max(1.3, new_ef)

    next_review = date.today() + timedelta(days=new_interval)

    return new_repetitions, new_interval, new_ef, next_review
