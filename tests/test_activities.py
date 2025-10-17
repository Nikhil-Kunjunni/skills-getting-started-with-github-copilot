import importlib
from fastapi.testclient import TestClient


app_module = importlib.import_module('src.app')
client = TestClient(app_module.app)


def test_get_activities_returns_dict():
    r = client.get('/activities')
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, dict)
    # at least one known activity exists
    assert 'Chess Club' in data


def test_signup_and_unregister_flow():
    email = 'pytest_user@example.com'
    activity_name = 'Chess Club'

    # Ensure not present
    before = client.get('/activities').json()[activity_name]['participants']
    if email in before:
        # cleanup if leftover from previous runs
        client.delete(f"/activities/{activity_name}/unregister?email={email}")

    # Signup
    r = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert r.status_code == 200
    assert 'Signed up' in r.json().get('message', '')

    # Confirm present
    participants = client.get('/activities').json()[activity_name]['participants']
    assert email in participants

    # Unregister
    r2 = client.delete(f"/activities/{activity_name}/unregister?email={email}")
    assert r2.status_code == 200
    assert 'Unregistered' in r2.json().get('message', '')

    # Confirm removed
    participants_after = client.get('/activities').json()[activity_name]['participants']
    assert email not in participants_after
