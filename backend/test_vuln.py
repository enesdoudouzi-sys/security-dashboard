from vuln import evaluate

def test_insecure_services_flagged():
    hosts = [{"host": "10.0.0.5", "ports": [
        {"port": 23, "service": "telnet", "version": "", "state": "open"},
        {"port": 3306, "service": "mysql", "version": "", "state": "open"},
        {"port": 80, "service": "http", "version": "", "state": "open"},
    ]}]
    r = evaluate(hosts)
    titles = [f["title"] for f in r["findings"]]
    assert "Telnet offen" in titles
    assert "MySQL offen" in titles
    assert "Webserver ohne HTTPS" in titles
    assert r["risk_score"] > 0
    # kritischste zuerst
    assert r["findings"][0]["severity"] in ("critical", "high")

def test_clean_host_gives_info():
    r = evaluate([{"host": "x", "ports": [{"port": 443, "service": "https", "version": "", "state": "open"}]}])
    assert r["risk_score"] == 0
    assert r["findings"][0]["severity"] == "info"

def test_https_present_no_http_warning():
    r = evaluate([{"host": "x", "ports": [
        {"port": 80, "service": "http", "version": "", "state": "open"},
        {"port": 443, "service": "https", "version": "", "state": "open"},
    ]}])
    assert "Webserver ohne HTTPS" not in [f["title"] for f in r["findings"]]
