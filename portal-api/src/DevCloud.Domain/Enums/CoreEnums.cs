namespace DevCloud.Domain.Enums;

public enum UserRole { Owner, CoFounder, Developer, ProductManager, Client }
public enum ProjectStatus { Active, Paused, Completed, Archived }
public enum TicketPriority { Low, Medium, High, Critical }
public enum TicketStatus { Backlog, Todo, InProgress, Review, Done }
public enum TechStack { DotNet, NodeJS, Python, Java, React, Flutter, CPP }
public enum DevEnvironmentStatus { Running, Stopped, Snapshotted }
public enum DeploymentEnvironment { Staging, Production }
public enum DeploymentStatus { Pending, Running, Success, Failed }
