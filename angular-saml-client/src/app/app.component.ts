import {Component, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {HttpErrorResponse} from "@angular/common/http/src/response";
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  title = 'app';

  apiToken: string;

  sessionId: string;

  errorMessage: string;

  externalServerApiExample;

  logoutSuccess: boolean;

  authServerApiExample: string;

  constructor(private httpClient: HttpClient,
      private route: ActivatedRoute) {

    this.route.queryParams.subscribe(params => {
        this.setSessionCookie(params['sessionId']);
    });
  }

  ngOnInit(): void {

  }

  setSessionCookie(sessionId: string) {
    if (sessionId != undefined && sessionId != "") {
      console.log('SessionId: ' + sessionId);
      //document.cookie = "JSESSIONID=" + sessionId;
      this.sessionId = sessionId;
    }
  }

  parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
};

  handleTokenSuccess(apiToken: string) {
    const payload = this.parseJwt(apiToken);

    console.log(payload);

    localStorage.setItem("apiToken", apiToken);
    this.apiToken = apiToken;
    this.errorMessage = null;
  }

  handleTokenError(error: HttpErrorResponse) {
    this.errorMessage = JSON.stringify(error);
  }

  postLogin() {
    var formData: any = new FormData();
    formData.append("username", 'juange');
    formData.append("password", 'juange');

    this.httpClient.post("/service/auth/login", formData,
      {
        withCredentials: true,
        responseType: 'text'
      }
      ).subscribe(
        r => { this.setSessionCookie(r)},
        error => this.handleTokenError(error));
  }

  getToken() {
    let apiToken = localStorage.getItem("apiToken");

    this.httpClient.get('/service/auth/token', {
      responseType: 'text',
    }).subscribe(
        r => this.handleTokenSuccess(r),
        error => this.handleTokenError(error));
  }

  callApiAuthServer() {
    let apiToken = localStorage.getItem("apiToken");

    this.httpClient.get('/service/api/hello', {
      responseType: 'text',
      withCredentials : true,
      headers: {
        "Authorization": apiToken != null ? apiToken : ''
      }
    }).subscribe(
      r => this.authServerApiExample = r,
      error => this.handleTokenError(error)
      );
  }

  callApiExternal() {
    let apiToken = localStorage.getItem("apiToken");

    this.httpClient.get('http://samlintegration.sandetel.int:8081/api/pacientes/1', {
      headers: {
        "Authorization": apiToken
      }
    }).subscribe(r => this.externalServerApiExample = JSON.stringify(r));
  }

  certificateLogin() {
    window.location.href="/service/servlet/afirma/login";
  }

  samlLogin() {
    window.location.href="/service/saml/login";
  }

  logout() {
    console.log('logout');
    localStorage.removeItem('apiToken');
    this.httpClient.get('/service/saml/logout').subscribe(() => this.logoutSuccess = true);
  }


}
